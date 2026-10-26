"use strict";

const GestaoUsuarios = {
  async chamar(dados) {
    const cliente = Banco.iniciar();
    const atual = await cliente.auth.getSession();

    if (atual.error || !atual.data.session) {
      throw new Error("Entre novamente na conta.");
    }

    const { data, error } = await cliente.functions.invoke(
      "dynamic-responder",
      {
        body: dados,
        headers: {
          Authorization: `Bearer ${atual.data.session.access_token}`
        }
      }
    );

    if (error) {
      let mensagem =
        "Não foi possível acessar a gestão. Confira a função no Supabase.";

      if (error.context) {
        try {
          const resposta = await error.context.json();
          mensagem = resposta.erro || resposta.message || mensagem;
        } catch {
          // Mantém a mensagem quando a resposta não contém JSON.
        }
      }

      throw new Error(mensagem);
    }

    if (data?.erro) {
      throw new Error(data.erro);
    }

    return data;
  }
};