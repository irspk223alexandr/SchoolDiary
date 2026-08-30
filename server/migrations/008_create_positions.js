exports.up = function(knex) {
    return knex.schema
      .createTable('positions', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable().unique();
        table.timestamps(true, true);
      })
      .createTable('user_positions', table => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.integer('position_id').unsigned().references('id').inTable('positions').onDelete('CASCADE');
        table.unique(['user_id', 'position_id']);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .dropTableIfExists('user_positions')
      .dropTableIfExists('positions');
  };