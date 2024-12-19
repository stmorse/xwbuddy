$(document).ready(function () {

  // $.ajax({
  //     url: 'assets/',
  //     success: function(data) {
  //         $(data).find("a:contains('.json')").each(function() {
  //             var filename = $(this).attr("href");
  //             // $('#archive-popup').append($('<p>', {
  //             //   class: 'archive-date',  
  //             //   text: filename
  //             // }));
  //         });
  //     }
  // });

  // const urlParams = new URLSearchParams(window.location.search);
  // const fileParam = urlParams.get('file');
  const fileParam = "";

  let jsonFile = "";
  let longFormattedDate = "";
  if (fileParam) {
    jsonFile = fileParam;
    longFormattedDate = fileParam; // TODO: fix
  } else {  
    // Get the current date in UTC
    const now = new Date();

    // Convert to EST (UTC-5)
    const options = {
      timeZone: "America/New_York", // Eastern Time
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(now);

    // Extract and format as yyyy-mm-dd for the filename
    const year = parts.find(part => part.type === "year").value;
    const month = parts.find(part => part.type === "month").value;
    const day = parts.find(part => part.type === "day").value;
    const formattedDate = `${year}-${month}-${day}`;
    jsonFile = `${formattedDate}.json`;

    // Get the long date for display
    const longDateOptions = {
      timeZone: "America/New_York",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const longDateFormatter = new Intl.DateTimeFormat("en-US", longDateOptions);
    longFormattedDate = longDateFormatter.format(now);
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