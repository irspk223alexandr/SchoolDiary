exports.up = function(knex) {
    return knex.schema.table('users', table => {
      table.string('phone', 20).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', table => {
      table.dropColumn('phone');
    });
  };