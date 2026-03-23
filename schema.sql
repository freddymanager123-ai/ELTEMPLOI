-- Esquema de DataBase Relacional - EL TEMPLO GYM

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    permissions JSONB
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    age INT,
    email VARCHAR(150),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'INACTIVO (SIN PLAN)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_type VARCHAR(20),
    duration_days INT,
    fixed_end_date DATE
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    plan_id INT REFERENCES plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    discount_pin VARCHAR(50),
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id),
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    barcode VARCHAR(100) UNIQUE
);

CREATE TABLE gym_apparel (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    size VARCHAR(10),
    color VARCHAR(30),
    gender VARCHAR(10)
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    client_id INT REFERENCES clients(id),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id),
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    reference_type VARCHAR(20),
    reference_id INT,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(30),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
