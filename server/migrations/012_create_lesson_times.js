exports.up = function(knex) {
    return knex.schema.createTable('lesson_times', table => {
      table.increments('id').primary();
      table.integer('lesson_number').notNullable().unique();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists('lesson_times');
  };