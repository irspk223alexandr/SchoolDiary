exports.up = function(knex) {
    return knex.schema
      .createTable('schedule_templates', table => {
        table.increments('id').primary();
        table.integer('class_id').unsigned().references('id').inTable('classes').onDelete('CASCADE');
        table.integer('subject_id').unsigned().references('id').inTable('subjects').onDelete('CASCADE');
        table.integer('teacher_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('lesson_number').notNullable();
        table.string('day_of_week', 20).notNullable(); // ПН, ВТ, СР, ...
        table.string('homework', 2000).defaultTo('');
        table.timestamps(true, true);
        table.unique(['class_id', 'day_of_week', 'lesson_number']);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('schedule_templates');
  };