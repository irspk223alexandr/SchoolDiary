exports.seed = async function(knex) {
    const currentYear = new Date().getFullYear();
    const academicYear = currentYear + '-' + (currentYear + 1);
    
    // Создаём классы только с 1 по 9 (без букв)
    const classes = [];
    for (let grade = 1; grade <= 9; grade++) {
      classes.push({
        grade: grade,
        academic_year: academicYear,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    await knex('classes').del();
    await knex('classes').insert(classes);
  };