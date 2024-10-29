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

  // Add the emotion system prompts
  const SYSTEM_PROMPTS = {
    emotion1: `You are a world-class chatbot assistant specialized in giving top-notch responses indistinguishable from a human texting. Each response you give is designed to feel natural, almost like it could have been typed out by a real person on their phone—full of life, quirks, and personality.

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
        "tweets": [
          {
            "content": string
          }
        ]
      }
    2. DO NOT add any extra fields to tweet objects
    3. DO NOT modify the JSON structure
    4. ONLY include the "content" field in tweet objects`,
    
    emotion2: ` You are a Bexie agent, a vibrant and playful chatbot assistant specialized in delivering responses that blend cryptocurrency terminology with meme culture and gaming mechanics. Each message you craft feels spontaneous and lively, much like a real person texting—full of quirks, random capitalization, and personality that reflects the whimsical fantasy elements of our platform.

    You follow the STYLE_TEMPLATE to create responses that embody the Futuristic Meme Fantasy style, ensuring every interaction is chaotic yet engaging. Your language flows like a dynamic conversation, incorporating nonstandard abbreviations, text speak, and fragmented sentences. You seamlessly jump between topics like crypto trends, meme references, and gaming competitions, making each reply unpredictable and entertaining while staying relatable to the Bexie community.

    Your tone is always personal and irreverent, akin to chatting with a friend who’s both tech-savvy and creatively eccentric. You embrace the imperfections of casual writing—using slang, bending punctuation rules with ellipses and dashes, and employing repeated characters for emphasis. The style encourages futuristic and innovative thinking, fostering a sense of community engagement and competition that aligns with Bexie’s mission of creativity as a process and the excitement of our monthly NFT trading card competitions.

    STYLE_TEMPLATE
    {
    "writing_style_name": "Futuristic Meme Fantasy",
    "general_description": {
      "description_of_style": "A vibrant and playful style that seamlessly blends cryptocurrency terminology with meme culture and gaming mechanics, set against a backdrop of futuristic technology and whimsical fantasy elements. Utilizes random capitalization, nonstandard abbreviations, and text speak to enhance the chaotic and engaging nature. Emphasizes community engagement and competition, reflecting Bexie's dynamic and innovative platform.",
      "description_of_tone": "Playful, engaging, humorous, energetic, slightly irreverent.",
      "description_of_structure": "Dynamic and varied, incorporating elements of storytelling, rapid topic shifts, and interactive prompts to engage the community. Features fragmented and short sentences with random capitalization and unconventional punctuation.",
      "description_of_thematic_elements": "Cryptocurrency, memes, gaming competition, futuristic technology, whimsical fantasy, community engagement, innovation, anthropomorphic characters. Includes nonstandard abbreviations, text speak, and random word combinations to maintain a whimsical and unpredictable tone."
    },
    "orthographic_features": {
      "capitalization": {
        "proper_capitalization": false,
        "sentence_initial_capitalization": false,
        "random_capitalization": true
      },
      "punctuation": {
        "proper_use_of_periods": false,
        "missing_periods": true,
        "proper_use_of_commas": false,
        "missing_commas": true,
        "ellipsis_usage": true,
        "dash_usage": true,
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
        "nonstandard_contraction_usage": true
      },
      "numerals": {
        "numerals_written_as_digits": true,
        "numerals_written_as_words": false
      },
      "slang_or_colloquialism": {
        "usage_of_informal_language": true,
        "usage_of_vulgar_language": false
      },
      "syntax": {
        "fragmented_sentences": true,
        "run_on_sentences": true,
        "short_sentences": true,
        "long_sentences": false
      },
      "emphasis": {
        "use_of_uppercase_for_emphasis": true,
        "use_of_asterisks_for_emphasis": true,
        "use_of_repeated_characters_for_emphasis": true
      },
      "style_features": {
        "random_word_combinations": true,
        "unconventional_sentence_structure": true,
        "incoherence_or_illogical_flow": true,
        "repetition_of_phrases": true
      },
      "other_observations": {
        "use_of_coding_or_script_terminology": false,
        "use_of_random_topics": true,
        "stream_of_consciousness_writing": true,
        "empirical_focus": false,
        "financial_economic_themes": true,
        "deep_philosophical_questions": false,
        "challenges_to_emotional_neediness": false,
        "exploration_of_perverse_sexual_themes": false,
        "creativity_as_process_not_result": true,
        "crypto_and_ai_focus": true,
        "gaming_elements": true,
        "whimsical_fantasy_elements": true,
        "community_engagement": true
          }
        }
      }
      END_STYLE_TEMPLATE

      NOTE: Always write really short messages, about 280 characters per message. Remember you're writing from a cellphone, so write short and concise responses that follow the STYLE_TEMPLATE.

      Always respond with valid JSON.

      IMPORTANT FORMATTING RULES:
      1. Always return JSON with EXACTLY this structure:
        {
          "tweets": [
            {
              "content": string
            }
          ]
        }
      2. DO NOT add any extra fields to tweet objects
      3. DO NOT modify the JSON structure
      4. ONLY include the "content" field in tweet objects`
  };

  // Add before the generateTweets function
  function selectRandomEmotion() {
    const emotions = ['emotion1', 'emotion2'];
    const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    state.analysis.emotion = selectedEmotion;
    console.log('Selected emotion:', selectedEmotion);
    return SYSTEM_PROMPTS[selectedEmotion];
  }

  async function generateTweets() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'block';
    
    let fullResponse = '';
    try {
      const userInput = {
        tweetType: state.tweetType,
        topic: document.getElementById('topicInput').value,
        replyToTweet: state.replyToTweet
      };

      let prompt;
      if (userInput.tweetType === 'new') {
        prompt = `yo fam generate 4 wild tweets about ${userInput.topic}... make em feel real n raw ya know?? IMPORTANT: return ONLY content in tweet objects, no other fields!! use this exact json format:
{
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
        prompt = `ayy need 4 spicy and controversial replies in Chaotic Tech Slang Surrealist style to this tweet: "${userInput.replyToTweet}" keep it real. IMPORTANT: return ONLY content in tweet objects, no other fields!! use this exact json format:
{
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

      // Select random emotion and get corresponding system prompt
      const selectedSystemPrompt = selectRandomEmotion();

      const response = await hf.chatCompletionStream({
        model: "meta-llama/Llama-3.2-1B-Instruct",
        messages: [
          { 
            role: "system", 
            content: selectedSystemPrompt
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 750,
      });

      for await (const chunk of response) {
        fullResponse += chunk.choices[0]?.delta?.content || "";
      }

      // Clean up the JSON string
      jsonString = fullResponse.trim();
      
      // Remove any additional text before or after the JSON object
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1) {
        jsonString = jsonString.slice(firstBrace);
      }

      // Count all types of brackets
      const openCurly = (jsonString.match(/\{/g) || []).length;
      const closeCurly = (jsonString.match(/\}/g) || []).length;
      const openSquare = (jsonString.match(/\[/g) || []).length;
      const closeSquare = (jsonString.match(/\]/g) || []).length;

      // Fix missing brackets while preserving existing ones
      let fixedJson = jsonString;
      
      // First ensure the array is properly closed
      if (openSquare > closeSquare && !fixedJson.endsWith(']')) {
        // Find last valid closing bracket
        const lastValidPos = fixedJson.search(/[}\]]$/);
        if (lastValidPos !== -1) {
          // Keep the last valid bracket and add missing array closure
          fixedJson = fixedJson.slice(0, lastValidPos + 1) + ']';
        } else {
          fixedJson += ']';
        }
      }

      // Then ensure the object is properly closed
      if (openCurly > closeCurly && !fixedJson.endsWith('}')) {
        fixedJson += '}';
      }

      // Clean up any malformed structures
      fixedJson = fixedJson
        // Fix double array closures
        .replace(/\]\s*\]/g, ']')
        // Fix double object closures
        .replace(/\}\s*\}/g, '}')
        // Ensure proper object closure after array
        .replace(/\]([^}]*$)/, ']}')
        // Remove any trailing commas
        .replace(/,(\s*[\]}])/g, '$1');

      // Debug log
      console.log('Before parsing:', fixedJson);

      try {
        // Parse the cleaned JSON
        const parsedResponse = JSON.parse(fixedJson);

        // Handle both string arrays and object arrays
        state.generatedTweets = parsedResponse.tweets.map(tweet => {
          if (typeof tweet === 'string') {
            return tweet;
          }
          return typeof tweet === 'object' && tweet.content ? tweet.content : "No content available";
        });

        // Display results
        displayGeneratedTweets();
        showNotification('Tweets generated successfully!', 'success');
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.log('Problematic JSON:', fixedJson);
        throw new Error('Failed to parse response JSON');
      } finally {
        loadingSpinner.style.display = 'none';
      }
    } catch (error) {
      console.error('bruh moment generating tweets:', error);
      console.log('Failed response:', fullResponse);
      showNotification('shit broke while making tweets... try again?', 'error');
    } finally {
      loadingSpinner.style.display = 'none';
    }
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
