exports.seed = async function(knex) {
    await knex('subjects').del();
    await knex('subjects').insert([
      { name: 'Математика' },
      { name: 'Русский язык' },
      { name: 'Литература' },
      { name: 'Физика' },
      { name: 'Химия' },
      { name: 'Информатика' },
      { name: 'История' },
      { name: 'Обществознание' },
      { name: 'География' },
      { name: 'Биология' },
      { name: 'Английский язык' },
      { name: 'Физкультура' },
      { name: 'Труд (Технология)' },
      { name: 'ОБЖ' },
      { name: 'Музыка' },
      { name: 'ИЗО' }
    ]);
  };