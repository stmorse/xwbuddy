$(document).ready(function () {

  // input Date() object and return [year, month, day]
  function getDateParts(date) {
    // Convert to EST (UTC-5)
    const options = {
      timeZone: "America/New_York", // Eastern Time
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);

    // Extract and format as yyyy-mm-dd for the filename
    const year = parts.find(part => part.type === "year").value;
    const month = parts.find(part => part.type === "month").value;
    const day = parts.find(part => part.type === "day").value;

    return [year, month, day];
  }

  // input Date() object and return "yyyy-mm-dd" (EST)
  function getFormattedDate(date) {
    const parts = getDateParts(date);
    const formattedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
    return formattedDate;
  }

  // input Date() object and return "Month D, YYYY" (EST)
  function getLongFormattedDate(date) {
    // Get the long date for display
    const longDateOptions = {
      timeZone: "America/New_York",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const longDateFormatter = new Intl.DateTimeFormat("en-US", longDateOptions);
    const longFormattedDate = longDateFormatter.format(date);
    return longFormattedDate;
  }

  // generate calendar for archive pop-up
  function generateCalendar(month, year, canGoBack) {
    const nowParts = getDateParts(new Date());
    const currentMonth = parseInt(nowParts[1]) - 1; // zero-based
    const currentYear = parseInt(nowParts[0]);
    const today = parseInt(nowParts[2]);
    const isCurrentMonth = (month === currentMonth && year === currentYear);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendar = $('<table>').addClass('calendar-table');

    // Month/year header with navigation
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const navRow = $('<tr>');
    const navCell = $('<td>').attr('colspan', 7).addClass('calendar-nav');

    const prevBtn = $('<span>').addClass('calendar-nav-btn calendar-prev').html('&larr;');
    if (!canGoBack) {
      prevBtn.addClass('disabled');
    }
    const nextBtn = $('<span>').addClass('calendar-nav-btn calendar-next').html('&rarr;');
    if (isCurrentMonth) {
      nextBtn.addClass('disabled');
    }
    const monthLabel = $('<span>').addClass('calendar-month-label').text(`${monthNames[month]} ${year}`);

    navCell.append(prevBtn).append(monthLabel).append(nextBtn);
    navRow.append(navCell);
    calendar.append(navRow);

    const headerRow = $('<tr>');
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    daysOfWeek.forEach(day => {
      headerRow.append($('<th>').text(day));
    });
    calendar.append(headerRow);

    let date = 1;
    for (let i = 0; i < 6; i++) {
      if (date >= daysInMonth) {
        break;
      }
      const row = $('<tr>');
      for (let j = 0; j < 7; j++) {
        const cell = $('<td>');

        if (i === 0 && j < firstDay) {
          cell.addClass('empty');
        } else if (date > daysInMonth) {
          cell.addClass('empty');
        } else {
          const cellDate = $('<div>').addClass('calendar-date').text(date);
          const cellPuzzle = $('<div>').addClass('calendar-puzzle');
          cell.append(cellDate);
          cell.append(cellPuzzle);

          // if we're not in the future, it's possible we have a buddy
          const isFutureDate = (year > currentYear) ||
                               (year === currentYear && month > currentMonth) ||
                               (year === currentYear && month === currentMonth && date > today);
          if (!isFutureDate) {
            const currentDay = new Date(year, month, date);
            const currentDayFormatted = getFormattedDate(currentDay);
            const jsonFile = `${currentDayFormatted}.json`;
  
            // if there's a puzzle stored for this date, link to it
            $.ajax({
              url: `assets/${jsonFile}`,
              type: 'HEAD',  // checks if file exists without loading it
              success: function() {
                const link = $('<a>').attr(
                  'href', `${window.location.href.split('?')[0]}?file=${jsonFile}`
                );
                const img = $('<img>').attr(
                  'src', 'assets/favicon.png'
                ).addClass('calendar-puzzle-image');
                link.append(img);
                cellPuzzle.append(link);
              },
              error: function(jqXHR, textStatus, error) {
                cellPuzzle.addClass('empty');
              }
            });
          }

          date++;
        }
        row.append(cell);
      }
      calendar.append(row);
    }
    return calendar;
  }

  const now = new Date();
  let displayMonth = now.getMonth();
  let displayYear = now.getFullYear();

  function renderCalendar() {
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    // Calculate one month back
    let prevMonth = nowMonth - 1;
    let prevYear = nowYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }

    // Can go back if we're currently viewing the current month
    const canGoBack = (displayMonth === nowMonth && displayYear === nowYear);

    $('.calendar-container').empty();
    $('.calendar-container').append(generateCalendar(displayMonth, displayYear, canGoBack));

    // Attach navigation handlers
    $('.calendar-prev').off('click').on('click', function() {
      if (!$(this).hasClass('disabled')) {
        displayMonth--;
        if (displayMonth < 0) {
          displayMonth = 11;
          displayYear--;
        }
        renderCalendar();
      }
    });

    $('.calendar-next').off('click').on('click', function() {
      if (!$(this).hasClass('disabled')) {
        displayMonth++;
        if (displayMonth > 11) {
          displayMonth = 0;
          displayYear++;
        }
        renderCalendar();
      }
    });
  }

  renderCalendar();

  const urlParams = new URLSearchParams(window.location.search);
  const fileParam = urlParams.get('file');

  let jsonFile = "";
  let longFormattedDate = "";
  if (fileParam) {
    jsonFile = fileParam;

    // convert filename back to (integer) year, mo, day
    const parts = fileParam.split('.')[0].split('-').map(str => parseInt(str));

    // convert to Date object (month is zero-based)
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    longFormattedDate = getLongFormattedDate(date);

  } else {
    const formattedDate = getFormattedDate(now);
    longFormattedDate = getLongFormattedDate(now);
    jsonFile = `${formattedDate}.json`;
  }

  $.getJSON(`assets/${jsonFile}`, function (data) {

    // HEADER
    const info = $('.puzzle-info');
    info.append(` &nbsp; &#183; &nbsp; ${longFormattedDate} 
      &nbsp; &#183; &nbsp; by ${data.constructors[0]}, 
      edited by ${data.editor}`);

    // GRID AND CLUES
    
    const hints = data.hints;
    data = data.body[0];

    // Adjust crossword grid size
    const gridSize = data.dimensions;
    $('.crossword').css({
      'grid-template-columns': `repeat(${gridSize.width}, 1fr)`,
      'grid-template-rows': `repeat(${gridSize.height}, 1fr)`
    });
      
    const grid = $('.crossword');
    const acrossClues = $('.across-clues');
    const downClues = $('.down-clues');
    const clueBanner = $('.clue-banner');
    const hintBanner = $('.hint-banner');
  
    // Create grid
    const cells = data.cells;
    cells.forEach((cell, index) => {
      const div = $('<div>')
        .addClass('cell')
        .attr('data-index', index);
  
      if (Object.keys(cell).length === 0) {
        div.addClass('black');
      } else {
        if (cell.label) {
          div.append($('<div>').addClass('cell-label').text(cell.label));
        }
      }

      grid.append(div);
    });

    // Add clues
    const clues = data.clues;
    clues.forEach((clue) => {
      const clueDiv = $('<div>')
        .addClass('clue')
        .attr('data-cells', clue.cells.join(','))
        .attr('data-direction', clue.direction) // Store direction for toggling
        .text(`${clue.label}. ${clue.text[0].plain}`);
      if (clue.direction === 'Across') {
        acrossClues.append(clueDiv);
      } else {
        downClues.append(clueDiv);
      }
    });

    // function to update the clue banner and highlight cells
    function updateActive(cell, toggle) {
      // get currently highlighted clue so we can figure out direction
      const currentClue = $('.clue.highlight');
      let direction = 'Across';
      if (currentClue.length) {
        direction = currentClue.data('direction');
      }

      // get index of clicked cell
      const index = $(cell).data('index');

      // get new direction
      if (toggle) {
        direction = direction === 'Across' ? 'Down' : 'Across';
      }

      // get clue associated with this cell in the new direction
      const newClue = clues.find((clue) => 
        clue.cells.includes(index) && clue.direction === direction);

      // get hint associated with this new clue
      const newHint = hints.find((hint) => 
        hint.label === newClue.label && hint.direction === newClue.direction);
      
      // update banner
      clueBanner.text(`${newClue.label}. ${newClue.text[0].plain}`);

      // remove highlighting off everything
      $('.cell').removeClass('highlight');
      $('.clue').removeClass('highlight');
      $('.cell').removeClass('spotlight');

      // re-highlight the cells of this clue
      newClue.cells.forEach((cellIndex) => {
        $(`.cell[data-index=${cellIndex}]`).addClass('highlight');
      });

      // highlight the clue text
      $(`.clue[data-cells='${newClue.cells.join(',')}']`).addClass('highlight');
      
      // make clicked cell a different color
      $(cell).removeClass('highlight');
      $(cell).addClass('spotlight');
      
      // if we have hint, display it
      if (newHint) {
        // update hint banner
        hintBanner.text(`${newHint.hint}`);
      } else {
        hintBanner.text(`No hint available.`);
      }
    }
  
    // Highlight clue and cells on click
    $('.cell').click(function () {
      // update the banner and highlighting
      updateActive(this, false);
    });

    // double-click to toggle between Across and Down clues
    $('.cell').on('dblclick', function () {
      // update the banner and highlighting
      updateActive(this, true);
    });
    
    $(document).on('keydown', function (e) {
      // tab key moves to next clue in same direction as current
      if (e.key === 'Tab') {
        e.preventDefault();
        const spotlightCell = $('.cell.spotlight');
        if (spotlightCell.length) {
          const index = spotlightCell.data('index');
          const currentClueIndex = data.clues.findIndex((clue) => 
            clue.cells.includes(index));
          
          if (currentClueIndex !== -1) {
            const nextClueIndex = (currentClueIndex + 1) % data.clues.length;
            const nextClue = data.clues[nextClueIndex];
    
            // Update clue banner
            clueBanner.text(`${nextClue.label}. ${nextClue.text[0].plain}`);
    
            // Update hint banner
            const relevantHint = hints.find((hint) => 
              hint.label === nextClue.label && hint.direction === nextClue.direction);
            if (relevantHint) {
              hintBanner.text(`${relevantHint.hint}`);
            } else {
              hintBanner.text(`No hint available.`);
            }
    
            // Highlight next clue and its associated cells
            $('.cell').removeClass('highlight');
            $('.clue').removeClass('highlight');
            $('.cell').removeClass('spotlight');
    
            nextClue.cells.forEach((cellIndex) => {
              $(`.cell[data-index=${cellIndex}]`).addClass('highlight');
            });
            $(`.clue[data-cells='${nextClue.cells.join(',')}']`).addClass('highlight');
            $(`.cell[data-index=${nextClue.cells[0]}]`).addClass('spotlight');
          }
        }
      }
    });
  
    // clicking on clues highlights associated cells
    $('.clue').click(function () {
      const cellsToHighlight = $(this).data('cells').split(',').map(Number);

      $('.cell').removeClass('highlight');
      $('.clue').removeClass('highlight');
      $('.cell').removeClass('spotlight');

      cellsToHighlight.forEach((cellIndex) => {
        $(`.cell[data-index=${cellIndex}]`).addClass('highlight');
      });
      $(this).addClass('highlight');

      // Update clue banner
      const clueText = $(this).text();
      clueBanner.text(clueText);

      // Update hint banner
      const clueLabel = $(this).text().split('.')[0];
      const relevantHint = hints.find((hint) => hint.label === clueLabel);

      if (relevantHint) {
        hintBanner.text(`${relevantHint.hint}`);
      } else {
        hintBanner.text(`No hint available.`);
      }
    });

    
    // BUTTON HANDLING

    $('#btn-reveal-letter').click(function () {
      const spotlightCell = $('.cell.spotlight');
      if (spotlightCell.length) {
        const index = spotlightCell.data('index');
        const cellData = cells[index];
        if (cellData && cellData.answer) {
          if (!spotlightCell.hasClass('revealed-answer')) {
            spotlightCell.append($('<span>').text(cellData.answer));
            spotlightCell.addClass('revealed-answer');
          }
        }
      }
    });

    $('#btn-reveal-answer').click(function () {
      $('.cell.highlight, .cell.spotlight').each(function () {
        const index = $(this).data('index');
        const cellData = cells[index];
        if (cellData && cellData.answer) {
          if (!$(this).hasClass('revealed-answer')) {
            $(this).append($('<span>').text(cellData.answer));
            $(this).addClass('revealed-answer');
          }
        }
      });
    });

    $('#btn-reveal-puzzle').click(function () {
      $('.cell').each(function () {
      const index = $(this).data('index');
      const cellData = cells[index];
      if (cellData && cellData.answer) {
        if (!$(this).hasClass('revealed-answer')) {
        $(this).append($('<span>').text(cellData.answer));
        $(this).addClass('revealed-answer');
        }
      }
      });
    });
  });


  $('.about-link').click(function(event) {
      event.preventDefault();
      $('#about-popup').fadeIn();
  });

  $('.archive-link').click(function(event) {
    event.preventDefault();
    $('#archive-popup').fadeIn();
});

  $('.about-close-btn').click(function() {
    $('#about-popup').fadeOut();
  });

  $('.archive-close-btn').click(function() {
    $('#archive-popup').fadeOut();
  });

  $(window).click(function(event) {
      if ($(event.target).is('#about-popup')) {
          $('#about-popup').fadeOut();
      }
  });
});