exports.up = function(knex) {
    return knex.schema.table('users', table => {
      table.string('plain_password', 255).nullable();
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.table('users', table => {
      table.dropColumn('plain_password');
    });
  };