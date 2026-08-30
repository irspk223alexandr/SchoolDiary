exports.up = function(knex) {
    return knex.schema.table('users', function(table) {
      table.string('login', 100).unique().notNullable().defaultTo('');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
      table.dropColumn('login');
    });
  };