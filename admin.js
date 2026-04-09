/**
 * ARQUIVO: admin.js
 * OBJETIVO: Gerenciar o CRUD (Criar, Ler, Atualizar e Deletar) das charadas 
 *           consumindo uma API(Backend) protegida por autenticação.
 * 
 * CONCEITOS:
 * 1. Fetch API: Usada para fazer requisições HTTP (GET, POST, PUT, DELETE).
 * 2. Async/Await: Uma forma limpa de trabalhar com código assíncrono (que demora um tempo para responder).
 * 3. LocalStorage: Usado para salvar o token do usuário no navegador e manter ele "logado".
 * 4. DOM Manipulation: Como o JavaScript altera o HTML na tela, escondendo/mostrando seções ou inserindo dados.
 */

// ==========================================
// CONFIGURAÇÕES GERAIS DA API
// ==========================================
// Substitua pela URL da sua API Flask real
const API_BASE_URL = 'https://api-charadas-backend-lovat.vercel.app'; 

// ==========================================
// REFERÊNCIAS DO DOM (Elementos do HTML)
// ==========================================
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');
const userInfo = document.getElementById('userInfo');
const userEmailDisplay = document.getElementById('userEmail');
const loginError = document.getElementById('loginError');

const charadaForm = document.getElementById('charadaForm');
const tabelaCharadas = document.getElementById('tabelaCharadas');
const totalCharadasEl = document.getElementById('totalCharadas');
const btnCancelar = document.getElementById('btnCancelar');
const formTitle = document.getElementById('formTitle');

// ==========================================
// ESTADO DA APLICAÇÃO (Variáveis que guardam informações)
// ==========================================
let tokenAtual = localStorage.getItem('adminToken') || null;
let charadas = []; // Guarda a lista de charadas vindas do backend

// ==========================================
// FUNÇÃO DE INICIALIZAÇÃO
// ==========================================
// Verifica se o usuário já tem um token quando a página carrega
function iniciarApp() {
    if (tokenAtual) {
        mostrarPainelAdmin();
        carregarCharadas();
    } else {
        mostrarLogin();
    }
}

// ==========================================
// 1. AUTENTICAÇÃO (Login / Logout)
// ==========================================

// Evento quando o usuário tenta submeter o formulário de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o formulário de recarregar a página (comportamento padrão do HTML)
    
    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    try {
        // Faz a requisição POST para a rota de login no backend
        const resposta = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Avisa a API que estamos mandando um arquivo JSON
            },
            body: JSON.stringify({ usuario, senha: password }) // Transforma objeto JS em texto JSON
        });

        // Se a API responder com status 200 (OK)
        if (resposta.ok) {
            const dados = await resposta.json(); // Pega a resposta(JSON) e transforma em objeto JS
            
            // O backend deve retornar um token na resposta (ex: dados.token)
            tokenAtual = dados.token;
            localStorage.setItem('adminToken', tokenAtual); // Salva no navegador do usuário
            
            loginForm.reset(); 
            mostrarPainelAdmin();
            carregarCharadas(); // Busca os dados protegidos agora que está logado
        } else {
            // Se errou a senha ou outro problema na requisição
            loginError.classList.remove('hidden');
        }
    } catch (erro) {
        console.error("Erro ao fazer login. A API está rodando?", erro);
        alert("Não foi possível conectar ao servidor.");
    }
});

// Evento do botão sair
btnLogout.addEventListener('click', () => {
    tokenAtual = null;
    localStorage.removeItem('adminToken'); // Remove o token
    mostrarLogin(); // Volta para tela de login
});

// ==========================================
// 2. CRUD: READ (Carregar lista de charadas)
// ==========================================
async function carregarCharadas() {
    try {
        // Faz requisição GET para rota protegida
        const resposta = await fetch(`${API_BASE_URL}/charadas`, {
            method: 'GET',
            headers: {
                // Passa o Token no cabeçalho (Header) para se identificar para a API!
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        if (resposta.status === 401 || resposta.status === 403) {
            // Se o status for Não Autorizado, desloga a pessoa
            alert("Sua sessão expirou ou token inválido.");
            btnLogout.click();
            return;
        }

        if (resposta.ok) {
            charadas = await resposta.json(); // Salva as charadas na nossa variavel
            renderizarTabela(); // Atualiza a tela com os novos dados
        } else {
            console.error("Não foi possível buscar as charadas.");
        }
    } catch (erro) {
        console.error("Erro na comunicação com a API:", erro);
    }
}

// Atualiza o HTML da tabela dinamicamente usando JavaScript
function renderizarTabela() {
    tabelaCharadas.innerHTML = ''; // Limpa a tabela
    totalCharadasEl.textContent = charadas.length;

    charadas.forEach(charada => {
        // Usa as famosas "Template Literals" (crases ` `) para criar a estrutura HTML misturando com variáveis
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-normal text-sm text-gray-800">${charada.pergunta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">${charada.resposta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editarCharada('${charada.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150">Editar</button>
                <button onclick="deletarCharada('${charada.id}')" class="text-red-600 hover:text-red-900 transition duration-150">Excluir</button>
            </td>
        `;
        tabelaCharadas.appendChild(tr);
    });
}

// ==========================================
// 3. CRUD: CREATE e UPDATE (Salvar ou Editar)
// ==========================================

// Evento quando clica no botão "Salvar" do formulário de charada
charadaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Pega os valores dos inputs
    const id = document.getElementById('charadaId').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;

    const charadaData = { pergunta, resposta };

    try {
        let url = `${API_BASE_URL}/charadas`;
        let metodoHTTP = 'POST'; // Se não tiver ID é uma nova charada -> POST

        // Se tiver o ID, significa que estamos editando uma charada existente
        if (id) {
            url = `${API_BASE_URL}/charadas/${id}`;
            metodoHTTP = 'PUT'; // Edição = PUT
        }

        const respostaApi = await fetch(url, {
            method: metodoHTTP,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAtual}` // Token sempre obrigatório!
            },
            body: JSON.stringify(charadaData)
        });

        if (respostaApi.ok) {
            alert(id ? "Charada atualizada!" : "Charada criada com sucesso!");
            limparFormulario();
            carregarCharadas(); // Atualiza a lista
        } else {
            alert("Falha ao salvar a charada.");
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
});


// Função chamada quando clica no botão Editar da tabela
function editarCharada(id) {
    // Procura a charada que tem esse id no nosso array em memória
    const charada = charadas.find(c => String(c.id) === String(id)); 
    
    if (charada) {
        // Preenche o formulário com os dados dela
        document.getElementById('charadaId').value = charada.id;
        document.getElementById('pergunta').value = charada.pergunta;
        document.getElementById('resposta').value = charada.resposta;

        // Muda título e mostra botão cancelar
        formTitle.textContent = "Editar Charada";
        btnCancelar.classList.remove('hidden');
    }
}


// Evento cancelar edição
btnCancelar.addEventListener('click', limparFormulario);

function limparFormulario() {
    charadaForm.reset();
    document.getElementById('charadaId').value = '';
    formTitle.textContent = "Nova Charada";
    btnCancelar.classList.add('hidden');
}


// ==========================================
// 4. CRUD: DELETE (Excluir)
// ==========================================
async function deletarCharada(id) {
    // Confirm() mostra aquela caixinha padrão do navegador para confirmar se o usuário tem certeza
    if (!confirm("Tem certeza que deseja excluir esta charada permanentemente?")) {
        return; // Sai da função sem deletar se ele disser cancelar
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/charadas/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${tokenAtual}`
            }
        });

        if (resposta.ok) {
            carregarCharadas(); // Remove da tabela e força recarga do banco
        } else {
            alert("Falha ao excluir a charada.");
        }
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
    }
}


// ==========================================
// UTILITÁRIOS (Controle da Tela)
// ==========================================
function mostrarLogin() {
    loginSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    userInfo.classList.add('hidden');
    loginError.classList.add('hidden');
}

function mostrarPainelAdmin() {
    loginSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
}

// Inicia o app logo ao carregar o script
iniciarApp();
