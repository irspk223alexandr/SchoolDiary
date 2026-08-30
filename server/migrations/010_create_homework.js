exports.up = function(knex) {
    return knex.schema
      .createTable('homework', table => {
        table.increments('id').primary();
        table.integer('schedule_template_id').unsigned().references('id').inTable('schedule_templates').onDelete('CASCADE');
        table.date('date').notNullable();
        table.text('content').nullable();
        table.timestamps(true, true);
        // Уникальность: одно ДЗ на шаблон + дату
        table.unique(['schedule_template_id', 'date']);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('homework');
  };