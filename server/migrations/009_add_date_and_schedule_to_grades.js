exports.up = function(knex) {
    return knex.schema.table('grades', function(table) {
      table.date('date').nullable();
      table.integer('schedule_id').unsigned().references('id').inTable('schedule').onDelete('SET NULL');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('grades', function(table) {
      table.dropColumn('date');
      table.dropColumn('schedule_id');
    });
  };