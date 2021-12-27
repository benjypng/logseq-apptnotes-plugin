import '@logseq/libs';

const main = () => {
  console.log('Appointment notes plugin loaded');

  const getOrdinalNum = (n) => {
    return (
      n +
      (n > 0
        ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : '')
    );
  };

  const getDateForPage = (d, preferredDateFormat) => {
    const getYear = d.getFullYear();
    const getMonth = d.toString().substring(4, 7);
    const getMonthNumber = d.getMonth() + 1;
    const getDate = d.getDate();

    if (preferredDateFormat === 'MMM do yyyy') {
      return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
    } else if (
      preferredDateFormat.includes('yyyy') &&
      preferredDateFormat.includes('MM') &&
      preferredDateFormat.includes('dd') &&
      ('-' || '_' || '/')
    ) {
      var mapObj = {
        yyyy: getYear,
        dd: ('0' + getDate).slice(-2),
        MM: ('0' + getMonthNumber).slice(-2),
      };
      let dateStr = preferredDateFormat;
      dateStr = dateStr.replace(/yyyy|dd|MM/gi, function (matched) {
        return mapObj[matched];
      });
      return dateStr;
    } else {
      return `${getMonth} ${getOrdinalNum(getDate)}, ${getYear}`;
    }
  };

  const addToEmptyPage = async (currPage, date) => {
    const dateBlock = await logseq.Editor.insertBlock(
      currPage.name,
      `## [[${date}]]`,
      { isPageBlock: true }
    );

    // insert blank block below
    const blankBlock = await logseq.Editor.insertBlock(dateBlock.uuid, '', {
      before: false,
      sibling: false,
    });

    await logseq.Editor.editBlock(blankBlock.uuid);
  };

  const addToNotEmptyPage = async (pbt, date) => {
    const pbtContent = pbt[0].content.substring(5, pbt[0].content.length - 2);

    if (date === pbtContent) {
      return;
    } else {
      const dateBlock = await logseq.Editor.insertBlock(
        pbt[0].uuid,
        `## [[${date}]]`,
        { before: true, sibling: true }
      );

      // insert blank block below
      const blankBlock = await logseq.Editor.insertBlock(dateBlock.uuid, '', {
        before: false,
        sibling: false,
      });

      await logseq.Editor.editBlock(blankBlock.uuid);
    }
  };

  logseq.provideModel({
    async go() {
      // Get preferred date format
      const userConfigs = await logseq.App.getUserConfigs();
      const preferredDateFormat = userConfigs.preferredDateFormat;

      // Go to page
      logseq.App.pushState('page', { name: 'Appointment Notes' });

      // Get current page for use in first time
      const currPage = await logseq.Editor.getCurrentPage();

      // Get page blocks tree to insert at top block
      const pbt = await logseq.Editor.getCurrentPageBlocksTree();

      /////////////////////////////////////
      ////////// REAL FUN STARTS //////////
      /////////////////////////////////////

      // Get date
      const day = new Date().getDay();
      // 0 is Sunday, 6 is Saturday, and 1 is Monday

      // If today is a Monday, create a block with today's date
      if (day === 1) {
        // Get today's date in preferred format
        const date = getDateForPage(new Date(), preferredDateFormat);

        // Check for empty page
        if (pbt.length === 0) {
          await addToEmptyPage(currPage, date);

          // If not, add Monday block to the top
        } else {
          addToNotEmptyPage(pbt, date);
        }

        // If today is not a Monday, get the next Monday
      } else {
        const todayDate = new Date();
        const todayDay = todayDate.getDay();

        // Get next Monday's date depending on the day today
        const nextMondayDate = new Date(
          todayDate.setDate(todayDate.getDate() + (8 - todayDay))
        );

        // Get next Monday's date in preferred format
        const date = getDateForPage(
          new Date(nextMondayDate),
          preferredDateFormat
        );

        // Check for empty page
        if (pbt.length === 0) {
          await addToEmptyPage(currPage, date);

          // If not, add Monday block to the top
        } else {
          addToNotEmptyPage(pbt, date);
        }
      }
    },
  });

  logseq.App.registerUIItem('toolbar', {
    key: 'logseq-apptnotes-plugin',
    template: `
      <a data-on-click="go"
      class="button">
      <i class="ti ti-notes"></i>
    </a>`,
  });
};

logseq.ready(main).catch(console.error);
