console.log('auth.js carregou!');

/* =============================================================
   auth.js — Login e controle de sessão
   
   
   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   * como ferramenta de aprendizado
   
   Responsável por:
   - Verificar usuário e senha
   - Salvar quem está logado (sessão)
   - Redirecionar pra página certa conforme o perfil
   - Proteger páginas (só acessa se estiver logado)
   ============================================================= */


/*
  USUÁRIOS PADRÃO DO SISTEMA
  Usando localStorage. Esses são criados automaticamente
  na primeira vez que o sistema abre.
*/

function criarUsuariosPadrao() {
  // Verifica se já existem usuários cadastrados
  const usuarios = buscarDados('conectaagenda_usuarios');
  console.log('funcao 1 ok');

  // Se já tem, não faz nada
  if (usuarios.length > 0) return;

  // Cria os usuários de demonstração
  const usuariosPadrao = [
    {
      id: 'coord01',
      senha: 'coord01',
      nome: 'Fulana Coordenadora',
      perfil: 'coordenador'
    },
    {
      id: 'prof01',
      senha: 'prof01',
      nome: 'Beltrano Professor',
      perfil: 'professor'
    },
    {
      id: 'aluno01',
      senha: 'aluno01',
      nome: 'Ciclano Aluno',
      perfil: 'aluno',
      turma: '1º Ano A'
    }
  ];

  salvarDados('conectaagenda_usuarios', usuariosPadrao);
}


/*
  FAZER LOGIN
  Chamada quando o formulário é enviado.
  Verifica se o usuário e senha batem com algum cadastrado.
*/

function fazerLogin(event) {
  event.preventDefault();

  // Pega o que o usuário digitou
  const usuario = document.getElementById('loginUsuario').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();
  const erroDiv = document.getElementById('loginErro');

  // Busca todos os usuários cadastrados
  const usuarios = buscarDados('conectaagenda_usuarios');

  // Procura um usuário que bata id + senha
  const usuarioEncontrado = usuarios.find(
    u => u.id === usuario && u.senha === senha
  );

  if (!usuarioEncontrado) {
    // Login falhou — mostra erro
    erroDiv.style.display = 'block';
    return;
  }

  // Login deu certo — salva a sessão
  erroDiv.style.display = 'none';

  const sessao = {
    id: usuarioEncontrado.id,
    nome: usuarioEncontrado.nome,
    perfil: usuarioEncontrado.perfil,
    turma: usuarioEncontrado.turma || null
  };

  salvarDados('conectaagenda_sessao', sessao);

  // Redireciona conforme o perfil
  window.location.href = 'painel.html';
}


/*
  VERIFICAR SESSÃO
  Chama no início de cada página protegida.
  Se não está logado, manda de volta pro login.
*/

function verificarSessao() {
  const sessao = buscarDados('conectaagenda_sessao');

  // Se não tem sessão, volta pro login
  if (!sessao || !sessao.id) {
    window.location.href = 'index.html';
    return null;
  }

  return sessao;
}


/*
  VERIFICAR PERFIL
  Checa se o usuário logado tem permissão pra acessar a página.
  Exemplo: verificarPerfil(['coordenador', 'professor'])
*/

function verificarPerfil(perfisPermitidos) {
  const sessao = verificarSessao();
  if (!sessao) return null;

  if (!perfisPermitidos.includes(sessao.perfil)) {
    // Sem permissão — redireciona
    window.location.href = 'painel.html';
    return null;
  }

  return sessao;
}


/*
  FAZER LOGOUT
  Limpa a sessão e volta pro login.
*/

function fazerLogout() {
  localStorage.removeItem('conectaagenda_sessao');
  window.location.href = 'index.html';
}


/*
  INICIALIZAÇÃO
  Roda quando a página de login carrega.
  Cria os usuários padrão se não existirem.
*/
document.addEventListener('DOMContentLoaded', () => {
  criarUsuariosPadrao();

  // Só redireciona se estiver NA PÁGINA DE LOGIN
  const paginaAtual = window.location.pathname.split('/').pop();

  if (paginaAtual === 'index.html' || paginaAtual === '') {
    const sessao = buscarDados('conectaagenda_sessao');
    if (sessao && sessao.id) {
      window.location.href = 'painel.html';
    }
  }
});