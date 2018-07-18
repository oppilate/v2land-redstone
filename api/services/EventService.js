const pinyin = require('pinyin');

module.exports = {

  findEvent: async (eventName, { includes = {} } = {}) => {
    const checkNewsIncluded = includes.stack && includes.news;

    let event = await Event.findOne({
      or: [
        { id: parseInt(eventName) > -1 ? parseInt(eventName) : -1 },
        { name: eventName },
      ],
    })
      .populate('stack', {
        where: {
          status: 'admitted',
          order: { '>': -1 },
        },
        sort: 'order DESC',
      })
      .populate('headerImage');

    if (event) {
      event = { ...event };
      event.newsCount = await News.count({
        where: {
          event: event.id,
          status: 'admitted',
        },
      });

      event.stackCount = await Stack.count({
        where: {
          event: event.id,
          status: 'admitted',
        },
      });

      const queue = [];
      const getStackedNews = async (i) => {
        const stack = { ...event.stack[i] };
        let newsExist;
        if (checkNewsIncluded && +includes.stack === stack.id) {
          newsExist = await News.count({
            event: event.id,
            id: +includes.news,
            stack: stack.id,
            status: 'admitted',
          });
        }
        stack.news = await News.find({
          where: {
            stack: stack.id,
            status: 'admitted',
          },
          sort: 'time ASC',
          ...(newsExist ? {} : { limit: 3 }),
        });
        if (!stack.time && stack.news.length) {
          stack.time = stack.news[0].time;
        }
        stack.newsCount = await News.count({
          where: {
            stack: stack.id,
            status: 'admitted',
          },
        });
        event.stack[i] = stack;
      };
      for (let i = 0; i < event.stack.length; i++) {
        queue.push(getStackedNews(i));
      }
      await Promise.all(queue);
    }

    return event;
  },

  generatePinyin: (name) => {
    const array = pinyin(name, {
      segment: false,
      style: 0,
    });

    const characters = [];
    for (let i = 0; i < 9; i++) {
      if (!array[i]) break;
      if (/^[a-z]*$/.test(array[i])) {
        characters.push(array[i]);
      }
    }

    return characters.length > 1
      ? characters.join('-')
      : null;
  },

};