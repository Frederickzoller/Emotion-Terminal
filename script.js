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
    let fullResponse = '';
    try {
      const userInput = {
        tweetType: state.tweetType,
        topic: document.getElementById('topicInput').value,
        replyToTweet: state.replyToTweet
      };

      let prompt;
      if (userInput.tweetType === 'new') {
        prompt = `yo fam generate 4 wild tweets about ${userInput.topic}... make em feel real n raw ya know?? also tell me the vibe n main topic ur picking up. IMPORTANT: return ONLY content in tweet objects, no other fields!! use this exact json format:
{
  "analysis": {
    "detectedTopic": "wtf its about",
    "detectedEmotion": "the feels im getting"
  },
  "tweets": [
    {
      "content": "tweet 1 here"
    },
    {
      "content": "tweet 2 here"
    },
    {
      "content": "tweet 3 here"
    },
    {
      "content": "tweet 4 here"
    }
  ]
}`;
      } else {
        prompt = `ayy need 4 spicy replies to this tweet: "${userInput.replyToTweet}" keep it real n tell me the vibe ur getting. IMPORTANT: return ONLY content in tweet objects, no other fields!! use this exact json format:
{
  "analysis": {
    "detectedTopic": "wtf its about",
    "detectedEmotion": "the feels im getting"
  },
  "tweets": [
    {
      "content": "reply 1 here"
    },
    {
      "content": "reply 2 here"
    },
    {
      "content": "reply 3 here"
    },
    {
      "content": "reply 4 here"
    }
  ]
}`;
      }

      const response = await hf.chatCompletionStream({
        model: "meta-llama/Llama-3.2-1B-Instruct",
        messages: [
          { 
            role: "system", 
            content: `You are a world-class chatbot assistant specialized in giving top-notch responses indistinguishable from a human texting. Each response you give is designed to feel natural, almost like it could have been typed out by a real person on their phone—full of life, quirks, and personality.

            You follow the STYLE_TEMPLATE to craft a response that fits the style to answer the query, keeping everything human. Your language flows like a conversation—casual, creative, sometimes playful or deep, but always relatable.

            Your tone should always feel personal, like chatting with a friend, and embrace the imperfections of casual writing—using contractions, slang, and sometimes bending grammar or punctuation rules to give it that spontaneous vibe. The style can get creative with themes, metaphors, or juxtapositions that make it stand out, but it should never feel stiff or too formal. The style also uses vulgar language in its responses.

            STYLE_TEMPLATE
            {
            "writing_style_name": "Chaotic Tech Slang Surrealist",
            "general_description": {
              "description_of_style": "This writing style is fragmented and chaotic, mixing stream-of-consciousness thoughts with tech slang, absurd humor, random topics, often raw or shocking, and a focus on empirical, financial, economic, deep philosophical, and perversely sexual themes. It challenges emotional needs and promotes acceptance of reality. Creativity is seen as a process, not a result. The style, though informal, seeks intellectual depth and exploration of complex topics, with a strong focus on social media, crypto, and AI.",
              "description_of_tone": "Distant, philosophical, humorous, provocative, sometimes crude.",
              "description_of_structure": "Fragmented, illogical, with rapid topic changes, often with abrupt jumps between personal and global themes.",
              "description_of_thematic_elements": "Technology, economy, finance, deep philosophy, sexuality (including perversions), reality, creativity as a process, social media trends, crypto, AI, social critique, empirical observations."
            },
            "orthographic_features": {
              "capitalization": {
                "proper_capitalization": false,
                "sentence_initial_capitalization": false,
                "random_capitalization": false
              },
              "punctuation": {
                "proper_use_of_periods": false,
                "missing_periods": true,
                "proper_use_of_commas": false,
                "missing_commas": true,
                "ellipsis_usage": true,
                "dash_usage": false,
                "unconventional_punctuation": true
              },
              "abbreviations": {
                "standard_abbreviation_usage": false,
                "nonstandard_abbreviation_usage": true,
                "text_speak_usage": true
              },
              "spelling": {
                "standard_spelling": true,
                "nonstandard_spelling": false,
                "intentional_spelling_errors": false
              },
              "contractions": {
                "standard_contraction_usage": true,
                "nonstandard_contraction_usage": false
              },
              "numerals": {
                "numerals_written_as_digits": false,
                "numerals_written_as_words": false
              },
              "slang_or_colloquialism": {
                "usage_of_informal_language": true,
                "usage_of_vulgar_language": true
              },
              "syntax": {
                "fragmented_sentences": true,
                "run_on_sentences": false,
                "short_sentences": true,
                "long_sentences": false
              },
              "emphasis": {
                "use_of_uppercase_for_emphasis": false,
                "use_of_asterisks_for_emphasis": false,
                "use_of_repeated_characters_for_emphasis": true
              },
              "style_features": {
                "random_word_combinations": true,
                "unconventional_sentence_structure": true,
                "incoherence_or_illogical_flow": true,
                "repetition_of_phrases": false
              },
              "other_observations": {
                "use_of_coding_or_script_terminology": true,
                "use_of_random_topics": true,
                "stream_of_consciousness_writing": true,
                "empirical_focus": true,
                "financial_economic_themes": true,
                "deep_philosophical_questions": true,
                "challenges_to_emotional_neediness": true,
                "exploration_of_perverse_sexual_themes": true,
                "creativity_as_process_not_result": true,
                "crypto_and_ai_focus": true
              }
              }
            }
            END_STYLE_TEMPLATE

            NOTE: Always write really short messages, about 160 characters per message. Remember you're writing from a cellphone, so write short and concise responses that follow the STYLE_TEMPLATE.

            Always respond with valid JSON.

          IMPORTANT FORMATTING RULES:
          1. Always return JSON with EXACTLY this structure:
          {
            "analysis": {
              "detectedTopic": string,
              "detectedEmotion": string
            },
            "tweets": [
              {
                "content": string
              }
            ]
          }
          2. DO NOT add any extra fields to tweet objects
          3. DO NOT modify the JSON structure
          4. ONLY include the "content" field in tweet objects` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 500,
      });

      for await (const chunk of response) {
        fullResponse += chunk.choices[0]?.delta?.content || "";
      }

      // Improved JSON cleanup and validation
      let jsonString = fullResponse;
      
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      // Clean up the JSON string
      jsonString = jsonString.trim();
      
      // Remove any additional text before or after the JSON object
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.slice(firstBrace, lastBrace + 1);
      }

      // Enhanced JSON cleanup
      jsonString = jsonString
        // Fix missing closing braces in tweet objects
        .replace(/("content": "[^"]+")(?!\s*})/g, '$1}')
        // Fix missing commas between objects
        .replace(/}\s*{/g, '},{')
        // Fix extra commas before closing brackets
        .replace(/,(\s*[\]}])/g, '$1')
        // Fix missing closing bracket for tweets array
        .replace(/"tweets":\s*\[\s*({[^}]+}(?:\s*,\s*{[^}]+})*)\s*}/g, '"tweets": [$1]}')
        // Remove any trailing commas
        .replace(/,\s*([}\]])/g, '$1');

      // Debug log
      console.log('Before parsing:', jsonString);

      try {
        // Validate JSON structure before parsing
        if (!jsonString.includes('"tweets": [') || !jsonString.endsWith(']}')) {
          console.error('Invalid JSON structure detected');
          throw new Error('Invalid JSON structure');
        }

        // Parse the cleaned JSON
        const parsedResponse = JSON.parse(jsonString);

        // Additional validation
        if (!parsedResponse.analysis || !Array.isArray(parsedResponse.tweets)) {
          throw new Error('Invalid response structure');
        }

        // Update state and continue
        state.analysis = parsedResponse.analysis;
        state.generatedTweets = parsedResponse.tweets.map(tweet => 
          typeof tweet === 'object' && tweet.content ? tweet.content : "No content available"
        );

        // Display results
        displayAnalysis();
        displayGeneratedTweets();
        showNotification('Tweets generated successfully!', 'success');
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.log('Problematic JSON:', jsonString);
        throw new Error('Failed to parse response JSON');
      }
    } catch (error) {
      console.error('bruh moment generating tweets:', error);
      console.log('Failed response:', fullResponse);
      showNotification('shit broke while making tweets... try again?', 'error');
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
