
-- BD: atec_secretaria 

DROP DATABASE IF EXISTS atec_secretaria;
CREATE DATABASE atec_secretaria;
USE atec_secretaria;

-- ---------------------------------------------------------------------------------------------------

-- ROLES

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome ENUM('ADMIN', 'SECRETARIA', 'FORMADOR', 'FORMANDO','CANDIDATO') UNIQUE NOT NULL
);

INSERT INTO roles (nome) VALUES
('CANDIDATO'),
('ADMIN'),
('SECRETARIA'),
('FORMADOR'),
('FORMANDO');

-- ---------------------------------------------------------------------------------------------------

-- UTILIZADORES

CREATE TABLE utilizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),

    auth_provider ENUM('local', 'google', 'facebook') DEFAULT 'local',
    provider_id VARCHAR(255),

    is_active BOOLEAN DEFAULT FALSE,
    activation_token VARCHAR(255),
    reset_password_token VARCHAR(255),

    role_id INT NOT NULL,

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255),

    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------------------------------------------------------------------------------------------------

-- CRIAR ADMIN

INSERT INTO utilizadores (
    nome_completo,
    email,
    password_hash,
    is_active,
    role_id
)
VALUES (
    'Administrador Geral',
    'admin@atec.pt',
    '$2b$10$K4RGbKl4BnVyPanu.QixiuPrP6hYh/nOL/Cp6xQvcM2.XrAZtPU3a', -- Password: '123456'
    TRUE,
    (SELECT id FROM roles WHERE nome = 'ADMIN')
);

-- ---------------------------------------------------------------------------------------------------

-- PERFIS: FORMANDOS / FORMADORES / SECRETARIA
-- (1:1 com utilizadores)

CREATE TABLE formadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    biografia TEXT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

CREATE TABLE formandos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    data_nascimento DATE,
    morada VARCHAR(255),
    telemovel VARCHAR(20),
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

CREATE TABLE secretaria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    cargo VARCHAR(100),
    observacoes TEXT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------------------------------

-- Inserir o Admin na tabela de Secretaria
INSERT INTO secretaria (utilizador_id, cargo)
VALUES (
    (SELECT id FROM utilizadores WHERE email = 'admin@atec.pt'),
    'Diretor'
);

-- ---------------------------------------------------------------------------------------------------

-- FICHEIROS / FOTOS EM BINÁRIO (sem Paths)

CREATE TABLE ficheiros_anexos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL,

    categoria ENUM('foto', 'documento', 'outro') DEFAULT 'documento',
    nome_original VARCHAR(255),
    tipo_ficheiro VARCHAR(100) NOT NULL,
    dados LONGBLOB NOT NULL, -- codigo binário 
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------------------------------

-- SALAS / MÓDULOS

CREATE TABLE salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_sala VARCHAR(50) NOT NULL UNIQUE,
    capacidade INT,
    localizacao VARCHAR(100)
);

CREATE TABLE modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_modulo VARCHAR(150) NOT NULL,
    area VARCHAR(100),
    carga_horaria INT NOT NULL
);

-- ---------------------------------------------------------------------------------------------------

-- CURSOS + TURMAS

CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_curso VARCHAR(150) NOT NULL,
    area VARCHAR(100) NOT NULL,
    estado ENUM('planeado', 'a decorrer', 'terminado') DEFAULT 'planeado'
);

CREATE TABLE curso_modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,
    id_modulo INT NOT NULL,
    sequencia INT DEFAULT 0,
    horas_padrao INT,
    
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_curso_modulo (id_curso, id_modulo)
);

CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,

    codigo_turma VARCHAR(50) NOT NULL UNIQUE, 
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,

    estado ENUM('planeado', 'a decorrer', 'terminado') DEFAULT 'planeado',

    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------------------------------

-- CURSO DETALHES -> por TURMA
-- Naquela turma: módulo X com formador X (e sala X)

CREATE TABLE turma_detalhes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_turma INT NOT NULL,
    id_modulo INT NOT NULL,
    id_formador INT, -- Nullable to allow creating module list first
    id_sala INT, -- Nullable

    sequencia INT NOT NULL,          -- ordem do módulo dentro da turma
    horas_planeadas INT NOT NULL,    -- ajuda a controlar máximo de horas do módulo

    UNIQUE (id_turma, id_modulo),    -- o mesmo módulo só aparece uma vez por turma
    UNIQUE (id_turma, sequencia),    -- a sequência é única dentro da turma

    FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_formador) REFERENCES formadores(id) ON DELETE SET NULL,
    FOREIGN KEY (id_sala) REFERENCES salas(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------------------------------

-- INSCRIÇÕES

CREATE TABLE inscricoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_formando INT, -- Nullable initially if we link by user_id, or we create a creating 'potential' formando
    user_id INT, -- Direct link to user for candidates who aren't formandos yet
    id_turma INT, -- Nullable, candidate applies to a course, not a specific class
    id_curso INT, -- The course they are applying for

    estado ENUM('PENDENTE', 'APROVADO', 'REJEITADO') DEFAULT 'PENDENTE',
    
    -- Dados da candidatura
    dados_candidatura JSON,
    pdf_file_id INT,

    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota_final DECIMAL(4,2) CHECK(nota_final BETWEEN 0.0 AND 20.0),
    observacoes TEXT,

    FOREIGN KEY (id_formando) REFERENCES formandos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
    FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE SET NULL,
    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (pdf_file_id) REFERENCES ficheiros_anexos(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------------------------------

-- AVALIAÇÕES por módulo por inscrição

CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_inscricao INT NOT NULL,
    id_modulo INT NOT NULL,

    nota DECIMAL(4,2) NOT NULL CHECK(nota BETWEEN 0.0 AND 20.0),
    data_avaliacao DATE,
    observacoes TEXT,

    UNIQUE (id_inscricao, id_modulo),

    FOREIGN KEY (id_inscricao) REFERENCES inscricoes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------------------------------

-- HORÁRIOS
-- AULAS (ligadas à turma e ao módulo/formador/sala)

CREATE TABLE horarios_aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_turma_detalhe INT NOT NULL,

    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    FOREIGN KEY (id_turma_detalhe) REFERENCES turma_detalhes(id) ON DELETE CASCADE
);                           

-- EVENTOS GENÉRICOS (reuniões, férias, etc.)

CREATE TABLE horarios_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,

    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------------------------------

-- DISPONIBILIDADE DOS FORMADORES

CREATE TABLE disponibilidade_formadores (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_formador INT NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    tipo ENUM('online', 'presencial') DEFAULT 'presencial',

    FOREIGN KEY (id_formador) REFERENCES formadores(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------------------------------

-- TRIGGERS: impedir sobreposição de aulas (sala e formador)

DELIMITER $$

CREATE TRIGGER trg_no_overlap_aulas_update
BEFORE UPDATE ON horarios_aulas
FOR EACH ROW
BEGIN
    DECLARE v_id_sala INT;
    DECLARE v_id_formador INT;

    SELECT id_sala, id_formador
    INTO v_id_sala, v_id_formador
    FROM turma_detalhes
    WHERE id = NEW.id_turma_detalhe;

    -- SALA
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        JOIN turma_detalhes td ON td.id = h.id_turma_detalhe
        WHERE h.id <> NEW.id
          AND td.id_sala = v_id_sala
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: sala já ocupada nesse intervalo.';
    END IF;

    -- FORMADOR
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        JOIN turma_detalhes td ON td.id = h.id_turma_detalhe
        WHERE h.id <> NEW.id
          AND td.id_formador = v_id_formador
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: formador já alocado nesse intervalo.';
    END IF;
END$$

DELIMITER ;