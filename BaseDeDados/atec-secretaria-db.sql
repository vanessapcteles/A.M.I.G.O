-- =========================================================
-- BD: atec_secretaria (NOVO COMPLETO, alinhado com o teu)
-- =========================================================

DROP DATABASE IF EXISTS atec_secretaria;
CREATE DATABASE atec_secretaria;
USE atec_secretaria;

-- =========================================================
-- 1) UTILIZADORES (base de autenticação)
-- =========================================================
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

    tipo_utilizador ENUM('admin', 'secretaria', 'formador', 'formando','utilizador') NOT NULL DEFAULT ('utilizador'),

    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255)
);

-- =========================================================
-- 2) PERFIS: FORMANDOS / FORMADORES / SECRETARIA
--    (1:1 com utilizadores)
-- =========================================================
CREATE TABLE formandos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    data_nascimento DATE,
    morada VARCHAR(255),
    telemovel VARCHAR(20),
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

CREATE TABLE formadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    biografia TEXT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

CREATE TABLE secretaria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL UNIQUE,
    cargo VARCHAR(100),
    observacoes TEXT,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- =========================================================
-- 3) FICHEIROS / FOTOS EM BINÁRIO (sem caminhos)
--    (serve para anexos e foto de perfil de qualquer utilizador)
-- =========================================================
CREATE TABLE ficheiros_anexos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT NOT NULL,

    categoria ENUM('foto', 'documento', 'outro') DEFAULT 'documento',
    nome_original VARCHAR(255),
    mime_type VARCHAR(100) NOT NULL,
    dados LONGBLOB NOT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- =========================================================
-- 4) SALAS / MÓDULOS
-- =========================================================
CREATE TABLE salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_sala VARCHAR(50) NOT NULL UNIQUE,
    capacidade INT,
    localizacao VARCHAR(100)
);

CREATE TABLE modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_modulo VARCHAR(150) NOT NULL,
    carga_horaria INT NOT NULL
);

-- =========================================================
-- 5) CURSOS (SEM datas) + TURMAS (COM datas)
-- =========================================================
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_curso VARCHAR(150) NOT NULL,
    area ENUM('Informática', 'Robótica', 'Electrónica', 'Outra') NOT NULL,
    estado ENUM('planeado', 'a decorrer', 'terminado') DEFAULT 'planeado'
);

CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_curso INT NOT NULL,

    codigo_turma VARCHAR(50) NOT NULL UNIQUE, -- ex: TPSI-PAL-0525
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,

    estado ENUM('planeado', 'a decorrer', 'terminado') DEFAULT 'planeado',

    FOREIGN KEY (id_curso) REFERENCES cursos(id) ON DELETE RESTRICT
);

-- =========================================================
-- 6) "CURSO DETALHES" -> por TURMA
--    Naquela turma: módulo X com formador X (e sala X)
-- =========================================================
CREATE TABLE turma_detalhes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_turma INT NOT NULL,
    id_modulo INT NOT NULL,
    id_formador INT NOT NULL,
    id_sala INT NOT NULL,

    sequencia INT NOT NULL,          -- ordem do módulo dentro da turma
    horas_planeadas INT NOT NULL,    -- ajuda a controlar máximo de horas do módulo

    UNIQUE (id_turma, id_modulo),
    UNIQUE (id_turma, sequencia),

    FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_formador) REFERENCES formadores(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_sala) REFERENCES salas(id) ON DELETE RESTRICT
);

-- =========================================================
-- 7) INSCRIÇÕES -> agora ligam a TURMAS (não a cursos)
-- =========================================================
CREATE TABLE inscricoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_formando INT NOT NULL,
    id_turma INT NOT NULL,

    data_inscricao DATE,
    nota_final DECIMAL(4,2) CHECK(nota_final BETWEEN 0.0 AND 20.0),
    observacoes TEXT,

    UNIQUE (id_formando, id_turma),

    FOREIGN KEY (id_formando) REFERENCES formandos(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE RESTRICT
);

-- =========================================================
-- 8) AVALIAÇÕES (notas por módulo por inscrição)
-- =========================================================
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

-- =========================================================
-- 9) HORÁRIOS (para todos os users)
--    9.1) AULAS (ligadas à turma e ao módulo/formador/sala)
-- =========================================================
CREATE TABLE horarios_aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_turma INT NOT NULL,
    id_turma_detalhe INT NOT NULL,

    id_sala INT NOT NULL,
    id_formador INT NOT NULL,

    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    FOREIGN KEY (id_turma) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_turma_detalhe) REFERENCES turma_detalhes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_sala) REFERENCES salas(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_formador) REFERENCES formadores(id) ON DELETE RESTRICT
);

-- 9.2) EVENTOS GENÉRICOS (qualquer utilizador: reuniões, férias, etc.)
CREATE TABLE horarios_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    utilizador_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,

    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- =========================================================
-- 10) DISPONIBILIDADE DOS FORMADORES
-- =========================================================
CREATE TABLE disponibilidade_formadores (
    id INT AUTO_INCREMENT PRIMARY KEY,

    id_formador INT NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,

    tipo ENUM('disponivel', 'indisponivel') DEFAULT 'disponivel',

    FOREIGN KEY (id_formador) REFERENCES formadores(id) ON DELETE CASCADE
);

-- =========================================================
-- 11) TRIGGERS: impedir sobreposição de aulas (sala e formador)
-- =========================================================
DELIMITER $$

CREATE TRIGGER trg_no_overlap_aulas_insert
BEFORE INSERT ON horarios_aulas
FOR EACH ROW
BEGIN
    -- Sala não pode ter overlap
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        WHERE h.id_sala = NEW.id_sala
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: sala já ocupada nesse intervalo.';
    END IF;

    -- Formador não pode ter overlap
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        WHERE h.id_formador = NEW.id_formador
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: formador já alocado nesse intervalo.';
    END IF;
END$$

CREATE TRIGGER trg_no_overlap_aulas_update
BEFORE UPDATE ON horarios_aulas
FOR EACH ROW
BEGIN
    -- Sala não pode ter overlap (ignorando o próprio registo)
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        WHERE h.id <> NEW.id
          AND h.id_sala = NEW.id_sala
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: sala já ocupada nesse intervalo.';
    END IF;

    -- Formador não pode ter overlap (ignorando o próprio registo)
    IF EXISTS (
        SELECT 1
        FROM horarios_aulas h
        WHERE h.id <> NEW.id
          AND h.id_formador = NEW.id_formador
          AND NEW.inicio < h.fim
          AND NEW.fim > h.inicio
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflito: formador já alocado nesse intervalo.';
    END IF;
END$$

DELIMITER ;
