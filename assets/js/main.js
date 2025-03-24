"use strict";

(() => {

  const gptForm = document.getElementById('gptForm');
  gptForm.addEventListener('submit', async event => {
    event.preventDefault();

    // get values from form inputs
    const amount = document.getElementById('amount').value;
    const language = document.getElementById('language').value;
    const level = document.getElementById('level').value;


    // build prompt
    const prompt = buildPrompt(amount, language, level);

    document.getElementById('loading').style.display = 'block';

    try {
      // invoke gpt api
      const gptResponse = await askGpt(prompt, amount);
      // display questionnaire
      displayQuestionnaire(gptResponse.choices[0].text);
    } catch (error) {
      document.getElementById('gptResults').innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
      console.error("Fetch error:", error);
    } finally {
      document.getElementById('loading').style.display = 'none';
    }
  })


  const buildPrompt = (amount, language, level) => {
    return `
      Respond with ONLY valid JSON array. Do not include explanations or markdown formatting.
      Generate ${amount} ${language} interview questions and answers for ${level} level.
      Format:
      [
        {
          "id": "unique-id",
          "question": "What is ...?",
          "answer": "..."
        }
      ]
  `;
  }

  const askGpt = async (prompt, amount) => {
    const apiKey = OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/completions';
    const estimatedTokens = Math.min(amount * 100, 2000);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: 'gpt-3.5-turbo-instruct',
        max_tokens: estimatedTokens,
        temperature: 0
      })
    }

    const response = await fetch(url, options);
    const json = await response.json();

    return json;
  }

  const displayQuestionnaire = (questionnaire) => {
    let data;

    try {
      data = JSON.parse(questionnaire);
    } catch (err) {
      console.error("Error parsing JSON:", err.message);
      document.getElementById('gptResults').innerHTML = `<p style="color:red;">Error: Invalid JSON format from the model</p><pre>${questionnaire}</pre>`;
      document.getElementById('loading').style.display = 'none';
      return;
    }

    const container = document.getElementById('gptResults');
    container.innerHTML = '';

    if (!Array.isArray(data)) {
      throw new Error("Expected an array of questions, but got something else.");
    }
    
    data.forEach(qna => {
      const questionEl = document.createElement('div');
      questionEl.className = 'question';

      const textSpan = document.createElement('span');
      textSpan.textContent = qna.question;

      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.innerHTML = '&#9654;'; // ► 

      questionEl.appendChild(textSpan);
      questionEl.appendChild(arrow);

      const answerEl = document.createElement('div');
      answerEl.className = 'answer';
      answerEl.id = qna.id;
      answerEl.textContent = qna.answer;

      questionEl.addEventListener('click', () => {
        const isOpen = answerEl.classList.toggle('open');
        arrow.classList.toggle('rotate', isOpen);
      });

      container.appendChild(questionEl);
      container.appendChild(answerEl);
    });

    document.getElementById('loading').style.display = 'none';

  }

})();