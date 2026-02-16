# A.M.I.G.O - Academy Manager Interactive Global Organizer

**Projeto Final de Curso**  
**Unidades Curriculares:** UC006014 e UC00615  
**Autores:** Vanessa Teles & Ricardo Evans

---

## � Descrição do Projeto

O **A.M.I.G.O** é uma plataforma integrada de gestão escolar, desenvolvida para modernizar os processos administrativos e pedagógicos de uma instituição de ensino. O sistema centraliza a informação num ecossistema único, composto por uma **Aplicação Web** (para gestão administrativa e pedagógica) e uma **Aplicação Móvel** (para consulta rápida por parte de alunos e professores).

O objetivo principal é desmaterializar processos como candidaturas, gestão de horários, lançamento de avaliações e comunicação escolar.

---

## 🚀 Funcionalidades Principais

### 🌐 Plataforma Web (Backoffice & Frontoffice)
*   **Gestão de Utilizadores:** Controlo de perfis (Admin, Secretaria, Formador, Formando) e permissões.
*   **Gestão Académica:** Criação e edição de Cursos, Módulos (UFCDs), Turmas e Salas.
*   **Horários Inteligentes:** Algoritmo de geração de horários com validação de conflitos (Sala/Formador/Turma).
*   **Avaliações:** Lançamento de notas e pautas por módulo.
*   **Candidaturas:** Processo de inscrição online para novos formandos.
*   **Dashboard:** Análise estatística em tempo real.
*   **Suporte:** Chatbot integrado (Tawk.to) com sistema de tickets offline.

### 📱 Aplicação Móvel (Android)
*   **Autenticação Segura:** Login com suporte a 2FA (Duplo Fator de Autenticação).
*   **Consultas Rápidas:** Acesso ao horário escolar atualizado.
*   **Caderneta Digital:** Visualização de notas e módulos concluídos.
*   **Perfil:** Gestão de dados pessoais.

---

## 🛠️ Stack Tecnológica

### Backend (API REST)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Base de Dados:** MySQL (Relacional)
*   **Cache:** Redis
*   **Autenticação:** JWT (JSON Web Tokens), Passport.js
*   **Email:** Nodemailer

### Frontend (Web)
*   **Framework:** React (Vite)
*   **Estilos:** Tailwind CSS / CSS Modules
*   **HTTP Client:** Axios

### Mobile
*   **Framework:** React Native
*   **Plataforma:** Expo / Android

### Infraestrutura
*   **Containerização:** Docker & Docker Compose

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e a correr.
*   [Node.js](https://nodejs.org/) (v18+) (Opcional, para desenvolvimento local fora do Docker).

### 1. Clonar e Configurar
Certifique-se que possui o ficheiro `.env` na raiz do projeto com as variáveis de ambiente necessárias (DB_HOST, chaves de API, etc.).

### 2. Iniciar a Aplicação (Docker)
A forma mais simples de iniciar todo o ecossistema é utilizando o Docker Compose. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

Este comando irá iniciar:
*   Container MySQL (Porta 3306)
*   Container Redis (Porta 6379)
*   Container Backend (Porta 3001)
*   Container Frontend (Porta 5173)

### 3. Popular a Base de Dados (Seed)
Para carregar dados iniciais de teste (utilizadores, cursos, salas), execute o seguinte comando num novo terminal:

```bash
docker exec -it node_backend npm run seed
```

---

## 📖 Credenciais de Teste

Após o *seed*, pode utilizar a seguinte conta:

| Perfil | Email | Password |
| :--- | :--- | :--- |
| **Administrador** | `admin@atec.pt` | `admin123` |

> **Nota:** Novos registos feitos através da página de login serão criados com o perfil de **Candidato** e necessitam de aprovação da Secretaria para acederem a funcionalidades avançadas.

---

## � Como Criar um Novo Utilizador (Processo Completo)

O sistema foi desenhado para que a criação de utilizadores siga um fluxo seguro e hierárquico.

### 1. Registo na Plataforma Web
Novos utilizadores (ex: futuros alunos ou professores) devem registar-se autonomamente:
1.  Aceda à página de login.
2.  Clique em **"Registar"** (Canto Superior Direito).
3.  Preencha o formulário com o Nome, Email e Password.
4.  O utilizador será criado automaticamente com o perfil de **Candidato**.

### 2. Atribuição de Perfil (Via Admin/Secretaria)
Para transformar um Candidato num Formando ou Formador:
1.  Faça login com a conta de **Administrador** (ver cima).
2.  Aceda ao menu **"Utilizadores"**.
3.  Encontre o novo utilizador na lista.
4.  Edite o perfil e altere o "Cargo" para a função desejada (**Formando**, **Formador**, ou **Secretaria**).
5.  Guarde as alterações. O utilizador terá agora permissões adequadas ao seu novo papel.

---

## �📱 Executar a Aplicação Móvel

Para correr a aplicação móvel em ambiente de desenvolvimento:

1.  Navegue até à pasta `mobile`:
    ```bash
    cd mobile
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento (Android):
    ```bash
    npm run android
    ```
    *(Necessita de emulador Android por exemplo Android Studio ou dispositivo físico ligado via USB)*

---

**© 2026 A.M.I.G.O Project**
