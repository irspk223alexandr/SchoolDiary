exports.seed = async function(knex) {
    await knex('lesson_times').del();
    await knex('lesson_times').insert([
      { lesson_number: 1, start_time: '08:30', end_time: '09:15' },
      { lesson_number: 2, start_time: '09:25', end_time: '10:10' },
      { lesson_number: 3, start_time: '10:20', end_time: '11:05' },
      { lesson_number: 4, start_time: '11:15', end_time: '12:00' },
      { lesson_number: 5, start_time: '12:10', end_time: '12:55' },
      { lesson_number: 6, start_time: '13:05', end_time: '13:50' },
      { lesson_number: 7, start_time: '14:00', end_time: '14:45' },
      { lesson_number: 8, start_time: '14:55', end_time: '15:40' }
    ]);
  };