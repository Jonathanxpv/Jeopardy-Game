const NUM_CATEGORIES = 6; // Adjust the number as needed
const NUM_QUESTIONS_PER_CAT = 5; // Adjust the number as needed

$("body").attr("id", "jeopardy");

let categories = [];

async function getCategoryIds(categoryId) {
  try {
    const response = await axios.get(
      "https://rithm-jeopardy.herokuapp.com/api/category",
      {
        params: {
          id: categoryId
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching category IDs:", error);
    return [];
  }
}

async function buildHtmlForClues(clueData) {
  let $tbody = $("<tbody>");
  if (clueData && Array.isArray(clueData.clues)) {
    for (const clues of clueData.clues) {
      const $tbodyRow = $("<tr>");
      $tbodyRow.append(`<td>${clues.question}</td>`);
      $tbody.append($tbodyRow);
    }
  } else {
    console.error("Invalid clueData structure:", clueData);
  }
  return $tbody;
}

async function getCategories(numOfCategories) {
  try {
    let results = await axios.get(
      "https://rithm-jeopardy.herokuapp.com/api/categories",
      {
        params: {
          count: numOfCategories
        }
      }
    );
    return _.sampleSize(results.data, 6);
  } catch (error) {
    console.error("Error fetching category:", error);
    return { title: "Unknown Category", clues: [] };
  }
}

async function buildHtmlForCategories(categoriesData) {
  const $thead = $("<thead>"); // Create thead element
  const $theadRow = $("<tr>");
  for (let category of categoriesData) {
    $theadRow.append(`<th>${category.title}</th>`);
  }
  $thead.append($theadRow);
  return $thead; // Return the thead element
}
async function fillTable() {
  const categoriesData = await getCategories(NUM_CATEGORIES);

  // Create the table element
  const $table = $("<table>");

  // Create the table body
  const $tbody = $("<tbody>");

  // Create a row for the category titles
  const $trCategory = $("<tr>");
  for (let category of categoriesData) {
    const $tdCategory = $("<td>").text(category.title);
    $trCategory.append($tdCategory);
  }
  $tbody.append($trCategory);

  // Iterate through each clue index
  for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
    // Create a row for the clue
    const $tr = $("<tr>");

    // Iterate through each category
    for (let category of categoriesData) {
      // Add a cell for the clue in the category
      const clueData = await getCategoryIds(category.id);
      const $clueContainer = $("<div>").addClass("clue-container").attr("id", category.id);
      const $clueText = $("<span>")
        .addClass("clue-text hidden")
        .attr("id", clueData.clues[i].id)
        .text(clueData.clues[i].question);

      const $dollarAmount = $("<span>")
        .addClass("dollar-amount")
        .text("$" + (i + 1) * 200);
      $clueContainer.append($clueText).append($dollarAmount);
      const $tdClue = $("<td>").append($clueContainer);
      $tr.append($tdClue);
    }

    // Append the row to the tbody
    $tbody.append($tr);
  }

  // Append the table body to the table
  $table.append($tbody);

  // Add click event handler to toggle clue/question visibility
  $table.on("click", ".dollar-amount", function () {
    $(this).hide();
    $(this).siblings(".clue-text").show();
  });

  // <div>
  //    <span class=dollar-amount>
  //    <span class=clue-text>
  //    <span class=clue-answer>
  // </div>

  // Return the table
  return $table;
}

$("body").on("click", ".dollar-amount", async function (event) {
  console.log("Clicked on dollar amount");
  const $cell = $(event.currentTarget).closest("td");
  const colIndex = $cell.index();
  const categoriesData = await getCategories(NUM_CATEGORIES);
  const category = categoriesData[colIndex];
  if (!category) {
    console.error("Category not found.");
    return;
  }
  const clueData = await getCategoryIds(category.id);
  const rowIndex = $(event.currentTarget).closest("tr").index() - 1;
  const clue = clueData.clues[rowIndex];
});

$(document).ready(function () {
  setupAndStart();
});

// Define the restartGame function
async function restartGame() {
  // Clear the existing table
  $("#jeopardy").empty();

  // Call setupAndStart to recreate the game board
  await setupAndStart();
}


async function setupAndStart() {
  console.log("Setting up and starting game...");
  // Create the loading screen element dynamically
  const loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";
  loadingScreen.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loadingScreen);

  // Simulate loading time
  setTimeout(function () {
    // Hide loading screen
    loadingScreen.style.display = "none";
    // Show the Jeopardy game content
  }, 5000); // Adjust the time as needed

  const $table = await fillTable();
  $("#jeopardy").empty().append($table);
  const $logoImg = $("<img>");
  $logoImg.attr("src", "https://1000logos.net/wp-content/uploads/2023/04/Jeopardy-Emblem-768x432.png");
  $logoImg.attr("alt", "Jeopardy Logo");
  $logoImg.addClass("game-logo");
  $("#jeopardy").prepend($logoImg);
  $("#jeopardy").off("click", "tbody");
  $("#jeopardy tbody").on("click", ".clue-text", async function (event) {
    console.log("Clicked on clue");
    const $clueContainer = $(event.target).closest(".clue-container");
    
    if ($clueContainer.find(".clue-text").is(":hidden")) {
      return;
    }

    const categoryId = $clueContainer.attr("id");
    if (!categoryId) {
      console.error("Invalid category ID");
      return;
    }
    const clueData = await getCategoryIds(categoryId);
    if (!clueData || !clueData.clues || clueData.clues.length === 0) {
      console.error("Clue not found or invalid data:", clueData);
      return;
    }

    // Get the answer from the clue data
    const rowIndex = $clueContainer.find(".clue-text").attr("id"); // Subtract 1 for the category row

    // Display the answer (e.g., in an alert or modal)
    for(let clue of clueData.clues){
      if(clue["id"] == rowIndex){
        alert(`Answer: ${clue.answer}`);
      }
    }

    // Prevent further clicks on the clue
    $clueContainer.off("click", ".clue-text");
  });

  // Create the restart button dynamically
  const $restartBtn = $("<button>").attr("id", "restartBtn").text("Restart Game");
  $("body").append($restartBtn);

  // Add event listener to the restart button
  $restartBtn.on("click", restartGame);
}

// Define the restartGame function
async function restartGame() {
  // Clear the existing table
  $("#jeopardy").empty();

  // Call setupAndStart to recreate the game board
  await setupAndStart();
}


