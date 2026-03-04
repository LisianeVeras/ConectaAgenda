/* =============================================================
   storage.js — Gerenciamento do localStorage

   * Desenvolvido com auxílio de IA (Claude/Anthropic)
   * como ferramenta de aprendizado

   O localStorage salva dados como texto no navegador.
   Usamos:
   - JSON.stringify() → converte objeto para texto (salvar)
   - JSON.parse()     → converte texto para objeto (ler)
   ============================================================= */

// Busca dados pelo nome da chave
// Retorna o que estiver salvo, ou array vazio se não existir
function buscarDados(chave) {
  const dados = localStorage.getItem(chave);
  if (!dados) return [];
  return JSON.parse(dados);
}

// Salva dados no localStorage
function salvarDados(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}