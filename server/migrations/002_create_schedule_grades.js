// server/migrations/002_create_schedule_grades.js
exports.up = function(knex) {
    return knex.schema
      .createTable('subjects', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable().unique();
      })
      .createTable('schedule', table => {
        table.increments('id').primary();
        table.date('date').notNullable();               // дата урока
        table.string('day_of_week', 20).notNullable(); // ПН, ВТ, ...
        table.integer('lesson_number').notNullable();  // номер урока по порядку
        table.integer('subject_id').unsigned().references('id').inTable('subjects');
        table.integer('teacher_id').unsigned().references('id').inTable('users'); // преподаватель
        table.string('class', 20).notNullable();       // для какого класса
        table.string('homework', 2000).defaultTo('');  // домашнее задание
        table.timestamps(true, true);
      })
      .createTable('grades', table => {
        table.increments('id').primary();
        table.integer('student_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('subject_id').unsigned().references('id').inTable('subjects');
        table.integer('quarter').notNullable();        // 1,2,3,4
        table.integer('grade').nullable();             // оценка 2-5 (или 1-5)
        table.boolean('exam').defaultTo(false);        // экзамен?
        table.boolean('final').defaultTo(false);       // итоговая?
        table.text('comment').nullable();
        table.timestamps(true, true);
      })
      .createTable('notes', table => {
        table.increments('id').primary();
        table.integer('student_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.date('date').notNullable();
        table.text('content', 2000).notNullable();
        table.timestamps(true, true);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('notes')
      .dropTableIfExists('grades')
      .dropTableIfExists('schedule')
      .dropTableIfExists('subjects');
  };