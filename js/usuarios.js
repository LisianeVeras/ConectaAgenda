/* =============================================================
   usuarios.js — Cadastro de usuários

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   
   Somente coordenadores podem acessar esta página.
   ============================================================= */

// Verifica se é coordenador ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const sessao = verificarPerfil(['coordenador']);
  if (!sessao) return;

  carregarTabela();
});

// Mostra o formulário
function abrirFormulario() {
  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Novo Usuário';
  limparFormulario();
}

// Esconde o formulário
function fecharFormulario() {
  document.getElementById('formCard').style.display = 'none';
  limparFormulario();
}

// Mostra campo turma só quando perfil é aluno
function mostrarCampoTurma() {
  const perfil = document.getElementById('usuarioPerfil').value;
  const campoTurma = document.getElementById('campoTurma');

  if (perfil === 'aluno') {
    campoTurma.style.display = 'block';
  } else {
    campoTurma.style.display = 'none';
  }
}

// Salva novo usuário ou atualiza existente
function salvarUsuario(event) {
  event.preventDefault();

  const editandoId = document.getElementById('editandoId').value;
  const nome = document.getElementById('usuarioNome').value.trim();
  const perfil = document.getElementById('usuarioPerfil').value;
  const id = document.getElementById('usuarioId').value.trim();
  const turma = document.getElementById('usuarioTurma').value.trim();

  let usuarios = buscarDados('conectaagenda_usuarios');

  // Verifica se o id já existe (só pra novos usuários)
  if (!editandoId) {
    const existe = usuarios.find(u => u.id === id);
    if (existe) {
      alert('Já existe um usuário com esse login!');
      return;
    }
  }

  const novoUsuario = {
    id: id,
    senha: id,
    nome: nome,
    perfil: perfil,
    turma: perfil === 'aluno' ? turma : null
  };

  if (editandoId) {
    // Editando — substitui o usuário
    const indice = usuarios.findIndex(u => u.id === editandoId);
    if (indice !== -1) {
      novoUsuario.senha = usuarios[indice].senha;
      usuarios[indice] = novoUsuario;
    }
  } else {
    // Novo — adiciona na lista
    usuarios.push(novoUsuario);
  }

  salvarDados('conectaagenda_usuarios', usuarios);
  fecharFormulario();
  carregarTabela();
}

// Carrega a tabela com todos os usuários
function carregarTabela() {
  const usuarios = buscarDados('conectaagenda_usuarios');
  const container = document.getElementById('tabelaContainer');

  if (usuarios.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icone">👤</div>
        <p>Nenhum usuário cadastrado.</p>
      </div>
    `;
    return;
  }

  // Define a cor do badge conforme o perfil
  function badgePerfil(perfil) {
    const cores = {
      coordenador: 'badge-vermelho',
      professor: 'badge-azul',
      aluno: 'badge-verde'
    };
    return cores[perfil] || 'badge-azul';
  }

  container.innerHTML = `
    <div class="tabela-container">
      <table class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login</th>
            <th>Perfil</th>
            <th>Turma</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr>
              <td><strong>${u.nome}</strong></td>
              <td>${u.id}</td>
              <td><span class="badge ${badgePerfil(u.perfil)}">${u.perfil}</span></td>
              <td>${u.turma || '—'}</td>
              <td>
                <div class="tabela-acoes">
                  <button class="btn btn-secundario btn-pequeno" onclick="editarUsuario('${u.id}')">
                    ✏️ Editar
                  </button>
                  <button class="btn btn-perigo btn-pequeno" onclick="excluirUsuario('${u.id}')">
                    🗑️ Excluir
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Preenche o formulário pra editar
function editarUsuario(id) {
  const usuarios = buscarDados('conectaagenda_usuarios');
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) return;

  document.getElementById('formCard').style.display = 'block';
  document.getElementById('formTitulo').textContent = 'Editar Usuário';
  document.getElementById('editandoId').value = usuario.id;
  document.getElementById('usuarioNome').value = usuario.nome;
  document.getElementById('usuarioPerfil').value = usuario.perfil;
  document.getElementById('usuarioId').value = usuario.id;
  document.getElementById('usuarioTurma').value = usuario.turma || '';

  // Desabilita o campo de login ao editar
  document.getElementById('usuarioId').disabled = true;

  mostrarCampoTurma();
}

// Exclui um usuário
function excluirUsuario(id) {
  // Não deixa excluir a si mesmo
  const sessao = buscarDados('conectaagenda_sessao');
  if (sessao.id === id) {
    alert('Você não pode excluir seu próprio usuário!');
    return;
  }

  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  let usuarios = buscarDados('conectaagenda_usuarios');
  usuarios = usuarios.filter(u => u.id !== id);
  salvarDados('conectaagenda_usuarios', usuarios);

  carregarTabela();
}

// Limpa todos os campos do formulário
function limparFormulario() {
  document.getElementById('editandoId').value = '';
  document.getElementById('usuarioNome').value = '';
  document.getElementById('usuarioPerfil').value = '';
  document.getElementById('usuarioId').value = '';
  document.getElementById('usuarioId').disabled = false;
  document.getElementById('usuarioTurma').value = '';
  document.getElementById('campoTurma').style.display = 'none';
}