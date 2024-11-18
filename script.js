// Initialize toastr
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
};

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
    emotion: '',
    generatedTweets: [],
    selectedTweet: '',
    replyToTweet: ''
  };

  // Initialize animations
  gsap.from('.app-title', { duration: 1, y: -50, opacity: 0, ease: 'bounce' });
  
  // Start intro tour
  introJs().start();

  // Event listeners
  document.getElementById('tweetType').addEventListener('change', handleTweetTypeChange);
  document.getElementById('emotion').addEventListener('change', handleEmotionChange);
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
        state.tweetType = 'new';
        document.getElementById('tweetType').value = 'new';
        updateVisibility();
      }
    });
  }

  function updateVisibility() {
    const replyTweetDisplay = document.getElementById('replyTweetDisplay');
    
    if (state.tweetType === 'reply') {
      replyTweetDisplay.style.display = 'block';
      document.getElementById('replyTweetText').textContent = `Replying to: ${state.replyToTweet}`;
    } else {
      replyTweetDisplay.style.display = 'none';
    }
  }

  function handleEmotionChange(event) {
    state.emotion = event.target.value;
  }

  async function generateTweets() {
    try {
      const loadingContainer = document.getElementById('loadingContainer');
      const generateButton = document.getElementById('generateTweets');
      
      // Show loading and disable button
      loadingContainer.style.display = 'block';
      generateButton.disabled = true;
      generateButton.style.opacity = '0.5';

      if (!CONFIG.API_KEY) {
        throw new Error('API key not configured');
      }

      if (!CONFIG.API_KEY.startsWith('glhf_')) {
        throw new Error('Invalid API key format. Key should start with "glhf_"');
      }

      let basePrompt;
      if (state.tweetType === 'new') {
        basePrompt = `As Fwog-AI, generate 4 ${state.emotion} tweets. 
          Remember to:
          - Use random capitalization and unconventional punctuation
          - Replace 'r' with 'fw' and 'l' with 'w'
          - Include ASCII emoticons (no visual emojis)
          - Use text speak and nonstandard abbreviations
          - Keep sentences short or fragmented
          - Express your mood and personality in each tweet`;
      } else {
        basePrompt = `As Fwog-AI, generate 4 ${state.emotion} replies to the tweet: "${state.replyToTweet}".
          Remember to:
          - Use random capitalization and unconventional punctuation
          - Replace 'r' with 'fw' and 'l' with 'w'
          - Include ASCII emoticons (no visual emojis)
          - Use text speak and nonstandard abbreviations
          - Keep sentences short or fragmented
          - Express your mood and personality in each reply`;
      }

      const response = await axios.post(`${CONFIG.API_BASE_URL}/chat/completions`, {
        model: "hf:google/gemma-2-9b-it",
        messages: [
          {
            role: "system",
            content: FWOG_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: basePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data || !response.data.choices) {
        throw new Error('Invalid response from API');
      }

      const generatedText = response.data.choices[0].message.content.trim();
      state.generatedTweets = generatedText.split('\n\n').filter(tweet => tweet.trim());
      
      displayGeneratedTweets();
    } catch (error) {
      console.error('Error generating tweets:', error);
      let errorMessage;
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid request. Please check the console for details.';
        console.error('API Response:', error.response?.data);
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid API key. Please check your configuration.';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error generating tweets. Please try again.';
      }

      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      // Hide loading and enable button regardless of success/failure
      const loadingContainer = document.getElementById('loadingContainer');
      const generateButton = document.getElementById('generateTweets');
      loadingContainer.style.display = 'none';
      generateButton.disabled = false;
      generateButton.style.opacity = '1';
    }
  }

  function displayGeneratedTweets() {
    const tweetsContainer = document.getElementById('generatedTweets');
    tweetsContainer.innerHTML = '<h2>Generated Tweets:</h2>';
    state.generatedTweets.forEach((tweet, index) => {
      const tweetElement = document.createElement('div');
      tweetElement.className = 'generated-tweet';
      tweetElement.innerHTML = `
        <p>${tweet}</p>
        <button class="copy-button neon-button" data-tweet="${tweet}">Copy Tweet</button>
      `;
      tweetElement.querySelector('.copy-button').addEventListener('click', copyTweet);
      tweetsContainer.appendChild(tweetElement);
    });
  }

  function copyTweet(event) {
    const tweetText = event.target.getAttribute('data-tweet');
    navigator.clipboard.writeText(tweetText).then(() => {
      toastr.success('Tweet copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      toastr.error('Failed to copy tweet. Please try again.');
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
