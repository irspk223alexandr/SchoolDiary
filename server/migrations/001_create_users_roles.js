// server/migrations/001_create_users_roles.js
exports.up = function(knex) {
    return knex.schema
      .createTable('roles', table => {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique(); // 'Ученик', 'Преподаватель', 'Директор'
      })
      .createTable('users', table => {
        table.increments('id').primary();
        // Основные поля
        table.string('last_name', 100).notNullable();
        table.string('first_name', 100).notNullable();
        table.string('middle_name', 100).nullable();
        table.string('email', 255).notNullable().unique();
        table.string('password', 255).notNullable();
        table.string('avatar', 255).defaultTo('default.png');
        
        // Для учеников и преподавателей
        table.string('class', 20).nullable();          // например "11А"
        table.string('school_name', 255).nullable();   // название школы
        table.string('school_address', 255).nullable();
        table.string('school_phone', 20).nullable();
        table.string('school_site', 255).nullable();
        
        // Контакты
        table.string('home_address', 255).nullable();
        table.string('home_phone', 20).nullable();
        
        // Медицинская информация (для учеников)
        table.string('insurance_policy', 50).nullable();
        table.string('blood_type', 5).nullable();
        table.text('medical_contraindications', 1000).nullable();
        
        // Родители (для учеников)
        table.string('parent_full_name', 255).nullable();
        table.string('parent_phone', 20).nullable();
        
        // Для учителей
        table.string('position', 255).nullable();      // должность
        
        // Статус
        table.boolean('confirmed').defaultTo(true);    // можно сразу подтвердить
        table.timestamps(true, true);
      })
      .createTable('user_roles', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('user_roles')
      .dropTableIfExists('users')
      .dropTableIfExists('roles');
  };