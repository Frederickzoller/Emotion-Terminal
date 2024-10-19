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
    emotion: '',
    generatedTweets: [],
    selectedTweet: '',
    replyToTweet: '', // New state for storing the tweet to reply to
  };

  // Initialize animations
  gsap.from('.app-title', { duration: 1, y: -50, opacity: 0, ease: 'bounce' });
  
  // Start intro tour
  introJs().start();

  // Event listeners
  document.getElementById('tweetType').addEventListener('change', handleTweetTypeChange);
  document.getElementById('topics').addEventListener('change', handleTopicChange);
  document.getElementById('addTopic').addEventListener('click', handleCustomTopicAdd);
  document.getElementById('removeTopic').addEventListener('click', handleTopicRemove); // New event listener
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

  function handleTopicChange(event) {
    state.topics = Array.from(event.target.selectedOptions, option => option.value);
    updateTopicsList();
  }

  function handleCustomTopicAdd() {
    const customTopic = document.getElementById('customTopic').value.trim();
    if (customTopic && !state.topics.includes(customTopic)) {
      state.topics.push(customTopic);
      const option = document.createElement('option');
      option.value = customTopic;
      option.text = customTopic;
      option.selected = true;
      document.getElementById('topics').add(option);
      document.getElementById('customTopic').value = '';
      updateTopicsList();
    }
  }

  function handleTopicRemove() {
    const topicsSelect = document.getElementById('topics');
    const selectedOptions = Array.from(topicsSelect.selectedOptions);
    
    selectedOptions.forEach(option => {
      const index = state.topics.indexOf(option.value);
      if (index > -1) {
        state.topics.splice(index, 1);
        topicsSelect.remove(option.index);
      }
    });
    
    updateTopicsList();
  }

  function updateTopicsList() {
    const topicsList = document.getElementById('selectedTopics');
    topicsList.innerHTML = '';
    state.topics.forEach(topic => {
      const li = document.createElement('li');
      li.textContent = topic;
      topicsList.appendChild(li);
    });
  }

  function handleEmotionChange(event) {
    state.emotion = event.target.value;
  }

  async function generateTweets() {
    try {
      let prompt;
      if (state.tweetType === 'new') {
        prompt = `Generate 4 ${state.emotion} tweets about ${state.topics.join(', ')}`;
      } else {
        prompt = `Generate 4 ${state.emotion} replies to the tweet: "${state.replyToTweet}"`;
      }

      const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
        prompt: prompt,
        max_tokens: 100,
        n: 4,
        stop: null,
        temperature: 0.8,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      state.generatedTweets = response.data.choices.map(choice => choice.text.trim());
      displayGeneratedTweets();
    } catch (error) {
      console.error('Error generating tweets:', error);
      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error('Error generating tweets. Please try again.');
      } else {
        alert('Error generating tweets. Please try again.');
      }
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
