# Configuração do Airtable

## 1. Criar uma nova base
1. Acesse https://airtable.com/dashboard
2. Clique em "Add a base" > "Start from scratch"
3. Nome: "CincocincoJam"

## 2. Criar as tabelas

### Users
1. Renomeie a primeira tabela para "Users"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - uid (Single line text)
   - email (Email)
   - name (Single line text)
   - role (Single select):
     - Opções: professor, aluno, admin
   - created_at (Date)
   - updated_at (Date)
   - status (Single select):
     - Opções: active, inactive
   - profile_image (Attachment)

### Professors
1. Crie uma nova tabela "Professors"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - user_id (Single line text)
   - bio (Long text)
   - specialties (Multiple select)
   - social_media (Multiple line text)
   - bank_info (Long text)

### Courses
1. Crie uma nova tabela "Courses"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - title (Single line text)
   - description (Long text)
   - price (Number)
   - category (Single select):
     - Opções: dev, design, marketing, business, other
   - level (Single select):
     - Opções: beginner, intermediate, advanced
   - thumbnail (URL)
   - professor_id (Single line text)
   - status (Single select):
     - Opções: draft, published, archived
   - created_at (Date)
   - updated_at (Date)

### Enrollments
1. Crie uma nova tabela "Enrollments"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - user_id (Single line text)
   - course_id (Single line text)
   - status (Single select):
     - Opções: active, completed, cancelled
   - created_at (Date)
   - payment_id (Single line text)
   - affiliate_id (Single line text)

### Affiliates
1. Crie uma nova tabela "Affiliates"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - user_id (Single line text)
   - commission_rate (Number)
   - bank_info (Long text)
   - status (Single select):
     - Opções: active, inactive

### Settings
1. Crie uma nova tabela "Settings"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - site_name (Single line text)
   - site_description (Long text)
   - payment_gateway (Single select):
     - Opções: stripe, paypal
   - commission_rate (Number)
   - created_at (Date)
   - updated_at (Date)

### Lesson_Progress
1. Crie uma nova tabela "Lesson_Progress"
2. Configure os campos:
   - id (Formula): RECORD_ID()
   - user_id (Single line text)
   - lesson_id (Single line text)
   - completed (Checkbox)
   - created_at (Date)
   - updated_at (Date)

## 3. Configurar API Key
1. Acesse https://airtable.com/account
2. Na seção "API", gere uma nova API key
3. Copie a API key e o Base ID
4. Atualize o arquivo .env.local com as credenciais

## 4. Importar dados (opcional)
1. Para cada tabela, use o botão "Add records" > "Import data"
2. Selecione o arquivo CSV correspondente da pasta setup/airtable
3. Mapeie os campos conforme necessário

## 5. Verificar permissões
1. Acesse as configurações da base
2. Verifique se a API key tem permissões de leitura/escrita

# Dados de Teste para o Airtable

## Ordem de Importação
1. Users (já existe com o registro do usuário atual)
2. Professors
3. Courses
4. Enrollments
5. Affiliates

## Instruções de Importação

### 1. Professors
- Abra a tabela "Professors"
- Clique em "Add records" > "Import data"
- Selecione o arquivo Professors.csv
- Mapeie os campos conforme os nomes das colunas
- Importante: o user_id deve corresponder ao ID do seu usuário no Airtable

### 2. Courses
- Abra a tabela "Courses"
- Clique em "Add records" > "Import data"
- Selecione o arquivo Courses.csv
- Mapeie os campos conforme os nomes das colunas
- Importante: o professor_id deve corresponder ao ID do professor criado anteriormente

### 3. Enrollments
- Abra a tabela "Enrollments"
- Clique em "Add records" > "Import data"
- Selecione o arquivo Enrollments.csv
- Mapeie os campos conforme os nomes das colunas
- Ajuste os IDs de usuário e curso conforme necessário

### 4. Affiliates
- Abra a tabela "Affiliates"
- Clique em "Add records" > "Import data"
- Selecione o arquivo Affiliates.csv
- Mapeie os campos conforme os nomes das colunas

## Notas Importantes
- Os IDs nas tabelas são gerados automaticamente pelo Airtable
- Você precisará ajustar os IDs de referência (user_id, professor_id, etc.) após cada importação
- Certifique-se de que o status dos cursos e matrículas esteja correto 