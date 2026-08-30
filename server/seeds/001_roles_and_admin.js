const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  await knex('user_roles').del();
  await knex('users').del();
  await knex('roles').del();

  await knex('roles').insert([
    { id: 1, name: 'Ученик' },
    { id: 2, name: 'Преподаватель' },
    { id: 3, name: 'Директор' }
  ]);

  const hashed = await bcrypt.hash('admin123', 10);
  const inserted = await knex('users').insert({
    login: 'director', 
    last_name: 'Фамилия',
    first_name: 'Имя',
    middle_name: 'Отчество',
    email: 'director@school.ru',
    password: hashed,
    position: 'Директор',
    school_name: 'Муниципальное бюджетное общеобразовательное учреждение "Осинковская основная общеобразовательная школа"',
    school_address: 'Владимирская область, Вязниковский район, деревня Осинки, улица Школьная, дом 6',
    school_phone: '+7 900 (000) 00-00',
    school_site: 'https://t55559e.sch.obrazovanie33.ru/'
  }).returning('id');

  const adminId = inserted[0].id;
  await knex('user_roles').insert({ user_id: adminId, role_id: 3 });
};