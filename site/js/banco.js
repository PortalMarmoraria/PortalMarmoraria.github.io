"use strict";
const Banco = {
  cliente: null,
  usuario: null,
  perfil: null,
  nomesPerfis: {colaborador:"Colaborador",comercial:"Comercial",financeiro:"Financeiro",admin:"Administrador"},
  nomePerfil() {return this.perfil?.principal ? "Admin principal" : this.nomesPerfis[this.perfil?.perfil] || "Sem acesso";},
  permite(acao, doc) {
    const p=this.perfil;
    if(!p?.ativo || !Array.isArray(p.empresas) || !p.empresas.includes(doc.empresa))return false;
    if(!["contrato","recibo","orcamento"].includes(doc.tipo))return false;
    if(acao==="criar")return ["admin","colaborador"].includes(p.perfil) || (p.perfil==="comercial" && ["contrato","orcamento"].includes(doc.tipo)) || (p.perfil==="financeiro" && doc.tipo==="recibo");
    if(acao==="ler")return p.perfil==="admin" || (p.perfil==="colaborador" && doc.criado_por===this.usuario?.id) || (p.perfil==="comercial" && ["contrato","orcamento"].includes(doc.tipo)) || (p.perfil==="financeiro" && ["contrato","recibo"].includes(doc.tipo));
    if(acao==="editar")return p.perfil==="admin" || (doc.criado_por===this.usuario?.id && ((p.perfil==="comercial" && doc.tipo==="orcamento") || (p.perfil==="financeiro" && doc.tipo==="recibo")));
    return acao==="excluir" && p.perfil==="admin";
  },
  iniciar() {
    const config = window.PORTAL_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error("Configure a URL e a chave pública do Supabase em site/js/config.js.");
    }
    if (!window.supabase) throw new Error("Não foi possível carregar o serviço de login. Verifique sua conexão.");
    if (!this.cliente) this.cliente = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false}
    });
    return this.cliente;
  },
  async sessao() {
    const cliente = this.iniciar();
    const {data, error} = await cliente.auth.getUser();
    if (error || !data.user) throw new Error("Entre na sua conta para acessar os documentos.");
    const perfil = await cliente.from("portal_usuarios").select("nome,perfil,ativo,empresas,principal").eq("id", data.user.id).single();
    if (perfil.error || !perfil.data?.ativo) throw new Error("Sua conta não está autorizada. Entre em contato com o administrador.");
    this.usuario = data.user;
    this.perfil = perfil.data;
    return this.perfil;
  },
  async entrar(email, senha) {
    const {error} = await this.iniciar().auth.signInWithPassword({email, password: senha});
    if (error) throw new Error("Não foi possível entrar. Confira seu e-mail e sua senha.");
    try {return await this.sessao();} catch (erro) {
      await this.cliente.auth.signOut(); throw erro;
    }
  },
  async sair() {
    if (this.cliente) {
      const {error} = await this.cliente.auth.signOut();
      if (error) throw new Error("Não foi possível sair. Tente novamente.");
    }
    this.usuario = null; this.perfil = null;
  },
  async obter(id) {
    const {data, error} = await this.iniciar().from("documentos").select("*").eq("id", id).single();
    if (error) throw new Error("Documento não encontrado ou acesso não autorizado.");
    return data;
  },
  async listar(filtros, pagina = 0) {
    let consulta = this.iniciar().from("documentos")
      .select("id,empresa,tipo,cliente_nome,valor,data_documento,criado_em,versao,criado_por", {count: "exact"})
      .order("criado_em", {ascending: false}).order("id");
    if (filtros.nome) consulta = consulta.ilike("cliente_nome", "%" + filtros.nome.replace(/[%_\\]/g, "\\$&") + "%");
    if (filtros.empresa) consulta = consulta.eq("empresa", filtros.empresa);
    if (filtros.tipo) consulta = consulta.eq("tipo", filtros.tipo);
    if (filtros.inicio) consulta = consulta.gte("data_documento", filtros.inicio);
    if (filtros.fim) consulta = consulta.lte("data_documento", filtros.fim);
    const {data, error, count} = await consulta.range(pagina * 20, pagina * 20 + 19);
    if (error) throw new Error("Não foi possível carregar os documentos. Tente novamente.");
    return {documentos: data, total: count};
  },
  async salvar({id, empresa, tipo, dados, pdf, existente}) {
    await this.sessao();
    if(existente){
      const atual=await this.obter(id);
      if(atual.empresa!==empresa || atual.tipo!==tipo || !this.permite("editar",atual))throw new Error("Sua conta não pode editar este documento.");
    }else if(!this.permite("criar",{empresa,tipo}))throw new Error("Sua conta não pode criar este documento nesta empresa.");
    const dataBR = dados.dataano.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dataBR) throw new Error("Data do documento inválida.");
    const valor = Number(dados.valor.replace(/R\$|\s|\./g, "").replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor inválido.");
    const caminho = `${this.usuario.id}/${id}/${crypto.randomUUID()}.pdf`;
    const armazenamento = this.cliente.storage.from("documentos");
    const upload = await armazenamento.upload(caminho, pdf, {contentType: "application/pdf", upsert: false});
    if (upload.error) throw new Error("Não foi possível armazenar o PDF. Confira a conexão e o limite de armazenamento.");
    const registro = {
      cliente_nome: dados.nome, valor, data_documento: `${dataBR[3]}-${dataBR[2]}-${dataBR[1]}`,
      dados, pdf_path: caminho, atualizado_por: this.usuario.id,
      versao: existente ? existente.versao + 1 : 1
    };
    try {
      const resultado = existente
        ? await this.cliente.from("documentos").update(registro).eq("id", id).eq("versao", existente.versao).select().maybeSingle()
        : await this.cliente.from("documentos").insert({...registro, id, empresa, tipo, criado_por: this.usuario.id}).select().single();
      if (resultado.error) throw new Error("O documento não foi salvo. Verifique a conexão e as permissões da conta.");
      if (!resultado.data) throw new Error("O documento foi alterado em outra sessão. Reabra pelo histórico antes de editar.");
      return resultado.data;
    } catch (erro) {
      // Se a resposta foi perdida após o commit, confirmar o registro evita duplicações.
      try {
        const confirmado = await this.cliente.from("documentos").select("*").eq("id", id).maybeSingle();
        const atual = confirmado.data;
        const igual = atual && Object.keys(dados).length === Object.keys(atual.dados || {}).length
          && Object.keys(dados).every(chave => dados[chave] === atual.dados[chave]);
        if (!confirmado.error && atual && (atual.pdf_path === caminho || (!existente && atual.criado_por === this.usuario.id
          && atual.empresa === empresa && atual.tipo === tipo && atual.versao === 1 && igual))) {
          if (atual.pdf_path !== caminho) await armazenamento.remove([caminho]).catch(() => {});
          return atual;
        }
      } catch {}
      // A política do banco impede apagar um PDF caso a gravação tenha sido concluída.
      await armazenamento.remove([caminho]).catch(() => {});
      throw erro;
    }
  },
  async excluir(id, versao) {
    await this.sessao();
    if (this.perfil.perfil !== "admin") throw new Error("Somente o administrador pode excluir documentos.");
    const {data, error} = await this.cliente.rpc("excluir_documento_admin", {documento_id: id, versao_esperada: versao});
    if (error) throw new Error("Não foi possível confirmar a exclusão. Atualize o histórico; confira a migração SQL e tente novamente.");
    const pendente = !(await this.limparTarefa({id:data.tarefa_id, arquivos:data.arquivos}));
    return {pendente};
  },
  async limparTarefa(tarefa) {
    try {
      const storage = this.iniciar().storage.from("documentos");
      for (let i = 0; i < tarefa.arquivos.length; i += 100) {
        const {error} = await storage.remove(tarefa.arquivos.slice(i, i + 100));
        if (error) return false;
      }
      const resultado = await this.cliente.from("documentos_limpeza").delete().eq("id", tarefa.id).select("id").maybeSingle();
      return !resultado.error && !!resultado.data;
    } catch {return false;}
  },
  async limparPendentes() {
    if (this.perfil?.perfil !== "admin") return 0;
    const {data, error} = await this.iniciar().from("documentos_limpeza").select("id,arquivos").order("criado_em").limit(20);
    if (error) return -1;
    let pendentes = 0;
    for (const tarefa of data) if (!(await this.limparTarefa(tarefa))) pendentes++;
    return pendentes;
  },
  async linkPDF(caminho) {
    const {data, error} = await this.iniciar().storage.from("documentos").createSignedUrl(caminho, 300);
    if (error) throw new Error("Não foi possível abrir o PDF. Tente novamente.");
    return data.signedUrl;
  }
};
