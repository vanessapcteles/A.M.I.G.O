# 🎓 A.M.I.G.O - Academy Management Interactive Global Organizer

**Projeto Final de Curso | Desenvolvimento de Aplicações Web & Mobile**  
**Autores:** Vanessa Teles & Ricardo Evans

---

## 📋 Sobre o Projeto

O **A.M.I.G.O** é uma plataforma integrada de gestão escolar, desenhada para modernizar e centralizar os processos administrativos e pedagógicos de uma instituição de ensino.

O sistema elimina a burocracia através de um ecossistema digital único, composto por uma **Aplicação Web** (para a Secretaria, Formadores e Administração) e uma **Aplicação Móvel** (focada na experiência do aluno e consulta rápida).

---

## 🚀 Funcionalidades Principais

### 🌐 Plataforma Web (Backoffice & Dashboard)
*   **Gestão 360º:** Controlo total de Cursos, Módulos (UFCDs), Turmas, Salas e Utilizadores.
*   **Dashboards Inteligentes:** Visualização de estatísticas em tempo real sobre o estado da academia.
*   **Horários Dinâmicos:** Sistema de agendamento visual (*drag-and-drop*) com validação de conflitos.
*   **Geração Automática:** Algoritmo capaz de sugerir horários com base na disponibilidade de recursos.
*   **Pautas Digitais:** Lançamento e consulta de avaliações por módulo.

### 📱 Aplicação Móvel (Android)
*   **Experiência "On-the-go":** Consulta rápida de horários e salas.
*   **Caderneta do Aluno:** Visualização de notas e progresso curricular.
*   **Perfil Digital:** Gestão de dados pessoais e segurança da conta.

### 🛡️ Segurança & Infraestrutura
*   **Autenticação Forte:** Suporte a **2FA** (Dois Fatores) e Login via **Google**.
*   **Performance:** Implementação de **Redis** para caching de alta velocidade.
*   **Encriptação:** Dados sensíveis e palavras-passe protegidos com algoritmos de hash (Bcrypt).

---

## 🛠️ Stack Tecnológica

O projeto foi construído sobre uma arquitetura de microsserviços contentorizada:

| Área | Tecnologias |
| :--- | :--- |
| **Backend** | Node.js, Express, MySQL, Redis, JWT, Nodemailer |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Mobile** | React Native, Expo |
| **DevOps** | Docker, Docker Compose |

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
*   [Docker Desktop](https://www.docker.com/) instalado e em execução.

### 1. Iniciar o Ecossistema
Todo o ambiente (Base de Dados, API, Cache e Frontend) é orquestrado via Docker. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

O sistema ficará disponível em:
*   **Web App:** `http://localhost:5173`
*   **API:** `http://localhost:3001`

### 2. Popular a Base de Dados
Para carregar a estrutura inicial e dados de teste, execute num novo terminal:

```bash
docker exec -it node_backend npm run seed
```

---

## 🔑 Acesso e Credenciais

Por questões de segurança, **as credenciais de acesso (Administrador, Secretaria, Formadores) não estão publicadas neste repositório.**

> ⚠️ As credenciais de teste foram fornecidas em privado à equipa de avaliação.

Caso necessite de criar um novo acesso de raiz:
1.  Aceda à página de Registo na aplicação web.
2.  Crie uma nova conta (será atribuído o perfil de **Candidato**).
3.  Contacte um Administrador para elevar os privilégios da conta.

---

## 📱 Executar a Aplicação Móvel

Para testar a aplicação móvel em ambiente de desenvolvimento:

1.  Navegue até à pasta `mobile`:
    ```bash
    cd mobile
    ```
2.  Instale as dependências e inicie o servidor:
    ```bash
    npm install
    npx expo start --android
    ```
    *(Nota: Requer emulador Android configurado ou dispositivo físico)*

---

**© 2026 A.M.I.G.O Project** - Developed with ❤️ by Vanessa Teles & Ricardo Evans
