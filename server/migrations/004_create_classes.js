exports.up = function(knex) {
    return knex.schema
      .createTable('classes', table => {
        table.increments('id').primary();
        table.integer('grade').notNullable().unique(); // только номер класса 1-9
        table.integer('teacher_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
        table.string('academic_year', 20).notNullable();
        table.timestamps(true, true);
      })
      .then(() => {
        return knex.schema.table('users', table => {
          table.integer('class_id').unsigned().references('id').inTable('classes').onDelete('SET NULL');
        });
      });
  };
  
  exports.down = function(knex) {
    return knex.schema
      .table('users', table => {
        table.dropColumn('class_id');
      })
      .then(() => {
        return knex.schema.dropTableIfExists('classes');
      });
  };