$(document).ready(function () {
  
  // grab today's date and format as yyyy-mm-dd
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  console.log(formattedDate);

  $.getJSON(`assets/${formattedDate}.json`, function (data) {
    
    // HEADER
    // console.log('inside');


    // GRID AND CLUES

    const hints = data.hints;
    data = data.body[0];
      
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
        const relevantHint = hints.find((hint) => hint.label === toggledClue.label);
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
  });
});