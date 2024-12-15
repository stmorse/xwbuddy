$(document).ready(function () {

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

  // Extract and format as yyyy-mm-dd
  const year = parts.find(part => part.type === "year").value;
  const month = parts.find(part => part.type === "month").value;
  const day = parts.find(part => part.type === "day").value;
  const formattedDate = `${year}-${month}-${day}`;

  console.log(formattedDate);

  $.getJSON(`assets/${formattedDate}.json`, function (data) {
    
    // HEADER
    const info = $('.puzzle-info');
    info.append(` | ${formattedDate} | by ${data.constructors[0]}, 
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
  
    // Highlight clue and cells on click
    $('.cell').click(function () {
      const index = $(this).data('index');
      const relevantClue = clues.find((clue) => clue.cells.includes(index));
      const relevantHint = hints.find((hint) => hint.label === relevantClue.label);

      $('.cell').removeClass('highlight');
      $('.clue').removeClass('highlight');
      $('.cell').removeClass('spotlight');

      if (relevantClue) {
        // Update clue banner
        clueBanner.text(`${relevantClue.label}. ${relevantClue.text[0].plain}`);

        relevantClue.cells.forEach((cellIndex) => {
            $(`.cell[data-index=${cellIndex}]`).addClass('highlight');
        });
        $(`.clue[data-cells='${relevantClue.cells.join(',')}']`).addClass('highlight');

        // make clicked cell a different color
        $(this).removeClass('highlight');
        $(this).addClass('spotlight');
      }

      if (relevantHint) {
        // update hint banner
        hintBanner.text(`${relevantHint.hint}`);
      } else {
        hintBanner.text(`No hint available.`);
      }
    });

    // tab key moves to next clue in same direction as current
    $(document).on('keydown', function (e) {
      if (e.key === 'Tab') {
      e.preventDefault();
      const spotlightCell = $('.cell.spotlight');
      if (spotlightCell.length) {
        const index = spotlightCell.data('index');
        const currentClue = clues.find((clue) => clue.cells.includes(index));
        
        if (currentClue) {
        const currentDirection = currentClue.direction;
        const currentLabel = currentClue.label;
        const nextClue = clues.find((clue) => 
          clue.direction === currentDirection && clue.label > currentLabel
        );

        if (nextClue) {
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
      }
    });
  
    // Double-click to toggle between Across and Down clues
    $('.cell').on('dblclick', function () {
      const index = $(this).data('index');
      const currentClue = clues.find((clue) => clue.cells.includes(index));
      
      if (!currentClue) return; // Skip if no clue associated

      const currentDirection = currentClue.direction;
      const toggleDirection = currentDirection === 'Across' ? 'Down' : 'Across';

      // Find the clue in the toggled direction
      const toggledClue = clues.find(
        (clue) => clue.cells.includes(index) && clue.direction === toggleDirection
      );

      if (toggledClue) {
        // Update clue banner
        clueBanner.text(`${toggledClue.label}. ${toggledClue.text[0].plain}`);

        // update hint banner
        const relevantHint = hints.find((hint) => 
          hint.label === toggledClue.label && hint.direction === toggledClue.direction);
        if (relevantHint) {
          hintBanner.text(`${relevantHint.hint}`);
        } else {
          hintBanner.text(`No hint available.`);
        }

        // Highlight toggled clue and its associated cells
        $('.cell').removeClass('highlight');
        $('.clue').removeClass('highlight');

        toggledClue.cells.forEach((cellIndex) => {
          $(`.cell[data-index=${cellIndex}]`).addClass('highlight');
        });
        $(`.clue[data-cells='${toggledClue.cells.join(',')}']`).addClass('highlight');
      }
    });
  
    $('.clue').click(function () {
      const cellsToHighlight = $(this).data('cells').split(',').map(Number);

      $('.cell').removeClass('highlight');
      $('.clue').removeClass('highlight');

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
});