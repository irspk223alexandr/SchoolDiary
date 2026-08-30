exports.up = function(knex) {
    return knex.schema
      .createTable('schedule', table => {
        table.increments('id').primary();
        table.date('date').notNullable();
        table.string('day_of_week', 20).notNullable();
        table.integer('lesson_number').notNullable();
        table.integer('subject_id').unsigned().references('id').inTable('subjects').onDelete('CASCADE');
        table.integer('teacher_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('class_id').unsigned().references('id').inTable('classes').onDelete('CASCADE');
        table.string('homework', 2000).defaultTo('');
        table.timestamps(true, true);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('schedule');
  };