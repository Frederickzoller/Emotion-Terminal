// Main App component (modified for vanilla JS)
function initApp() {
  // Check if all required libraries are loaded
  const requiredLibraries = ['axios', 'gsap', 'Swal', 'toastr', 'introJs'];
  const missingLibraries = requiredLibraries.filter(lib => typeof window[lib] === 'undefined');
  
  if (missingLibraries.length > 0) {
    console.error('Missing required libraries:', missingLibraries);
    alert(`Error: Some required libraries are missing. Please check the console for details.`);
    return;
  }

  const state = {
    tweetType: 'new',
    topics: [],
    generatedTweets: [],
    selectedTweet: '',
    replyToTweet: '',
    analysis: {
      topic: '',
      emotion: ''
    }
  };

  // Initialize animations
  gsap.from('.app-title', { duration: 1, y: -50, opacity: 0, ease: 'bounce' });
  
  // Start intro tour
  introJs().start();

  // Event listeners
  document.getElementById('tweetType').addEventListener('change', handleTweetTypeChange);
  document.getElementById('generateTweets').addEventListener('click', generateTweets);
  document.getElementById('refineTweet').addEventListener('click', refineTweet);

  function handleTweetTypeChange(event) {
    state.tweetType = event.target.value;
    if (state.tweetType === 'reply') {
      promptForReplyTweet();
    }
    updateVisibility();
  }

  function promptForReplyTweet() {
    Swal.fire({
      title: 'Enter the tweet you want to reply to',
      input: 'textarea',
      inputPlaceholder: 'Enter the original tweet here...',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        state.replyToTweet = result.value;
        updateVisibility();
      } else {
        // If canceled, revert to 'new' tweet type
        state.tweetType = 'new';
        document.getElementById('tweetType').value = 'new';
        updateVisibility();
      }
    });
  }

  function updateVisibility() {
    const topicsStep = document.getElementById('step2');
    const replyTweetDisplay = document.getElementById('replyTweetDisplay');
    
    if (state.tweetType === 'reply') {
      topicsStep.style.display = 'none';
      replyTweetDisplay.style.display = 'block';
      document.getElementById('replyTweetText').textContent = `Replying to: ${state.replyToTweet}`;
    } else {
      topicsStep.style.display = 'block';
      replyTweetDisplay.style.display = 'none';
    }
  }

  const hf = new HfInference('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'); // Replace with your actual Hugging Face token

  // Initialize toastr
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000
  };

  async function generateTweets() {
    try {
      const userInput = {
        tweetType: state.tweetType,
        topic: document.getElementById('topicInput').value,
        replyToTweet: state.replyToTweet
      };

      let prompt;
      if (userInput.tweetType === 'new') {
        prompt = `Generate 4 tweets about ${userInput.topic}. Also analyze the emotional tone and main topic of the tweets. Return the result as a JSON object with this format:
        {
          "analysis": {
            "detectedTopic": "main topic detected",
            "detectedEmotion": "primary emotion detected"
          },
          "tweets": [
            {
              "content": "Tweet content here"
            }
          ]
        }`;
      } else {
        prompt = `Generate 4 replies to the tweet: "${userInput.replyToTweet}". Also analyze the emotional tone and main topic of the replies. Return the result as a JSON object with this format:
        {
          "analysis": {
            "detectedTopic": "main topic detected",
            "detectedEmotion": "primary emotion detected"
          },
          "tweets": [
            {
              "content": "Reply tweet content here"
            }
          ]
        }`;
      }

      const response = await hf.chatCompletionStream({
        model: "meta-llama/Llama-3.2-1B-Instruct",
        messages: [
          { role: "system", content: "You are a helpful assistant that generates tweets and analyzes their emotional tone and topics. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 500,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        fullResponse += chunk.choices[0]?.delta?.content || "";
      }

      const jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : fullResponse;
      const parsedResponse = JSON.parse(jsonString);

      // Update state with analysis and tweets
      state.analysis = parsedResponse.analysis;
      state.generatedTweets = parsedResponse.tweets.map(tweet => tweet.content || "No content available");

      // Display analysis and tweets
      displayAnalysis();
      displayGeneratedTweets();
      showNotification('Tweets generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating tweets:', error);
      showNotification('Error generating tweets. Please try again.', 'error');
    }
  }

  function displayAnalysis() {
    const analysisContainer = document.getElementById('tweetAnalysis');
    const topicElement = document.getElementById('detectedTopic');
    const emotionElement = document.getElementById('detectedEmotion');

    topicElement.textContent = `Detected Topic: ${state.analysis.detectedTopic}`;
    emotionElement.textContent = `Emotional Tone: ${state.analysis.detectedEmotion}`;
    analysisContainer.style.display = 'block';
  }

  function displayGeneratedTweets() {
    const tweetsContainer = document.getElementById('generatedTweets');
    tweetsContainer.innerHTML = '<h2>Generated Tweets:</h2>';
    state.generatedTweets.forEach((tweet, index) => {
      const tweetElement = document.createElement('div');
      tweetElement.className = 'generated-tweet';
      tweetElement.innerHTML = `
        <p>${tweet || "No tweet content available"}</p>
        <button class="copy-button neon-button" data-tweet="${tweet || ""}">Copy Tweet</button>
      `;
      tweetElement.querySelector('.copy-button').addEventListener('click', copyTweet);
      tweetsContainer.appendChild(tweetElement);
    });
  }

  function copyTweet(event) {
    const tweetText = event.target.getAttribute('data-tweet');
    navigator.clipboard.writeText(tweetText).then(() => {
      // Show success message
      showNotification('Tweet copied to clipboard!', 'success');
    }, (err) => {
      console.error('Could not copy text: ', err);
      // Show error message
      showNotification('Failed to copy tweet. Please try again.', 'error');
    });
  }

  function handleTweetSelection(tweet) {
    state.selectedTweet = tweet;
    document.getElementById('selectedTweetText').textContent = tweet;
    document.getElementById('selectedTweet').style.display = 'block';
    Swal.fire({
      title: 'Tweet Selected',
      text: 'You can now refine your selected tweet or copy it to post on Twitter.',
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  function refineTweet() {
    Swal.fire({
      title: 'Refine Tweet',
      input: 'textarea',
      inputValue: state.selectedTweet,
      showCancelButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        state.selectedTweet = result.value;
        document.getElementById('selectedTweetText').textContent = result.value;
        toastr.success('Tweet refined successfully!');
      }
    });
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// Replace toastr with a custom notification function
function showNotification(message, type = 'info') {
  const notificationElement = document.createElement('div');
  notificationElement.textContent = message;
  notificationElement.className = `notification ${type}`;
  document.body.appendChild(notificationElement);
  
  setTimeout(() => {
    notificationElement.remove();
  }, 3000);
}
