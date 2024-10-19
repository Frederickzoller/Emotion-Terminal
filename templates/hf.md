# Hugging Face Inference API Documentation (CDN Usage)

This documentation provides details on how to use the **Hugging Face Inference API** via CDN to interact with models, including **Meta Llama 3.1 8B** for tasks like text generation and chat completion.

## CDN Installation

To use the Hugging Face Inference API in your project via CDN, include the following `<script>` tag in your HTML file:

```html
<script type="module">
  import huggingfaceinference from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';
</script>
```

### Initialize Hugging Face Inference

Once you have included the script, initialize the API by creating an instance of `HfInference`:

```javascript
import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const hf = new HfInference('your-access-token-here'); // Replace with your actual token
```

**Important**: Using an access token is optional for getting started, but it is recommended to avoid rate limits. Generate your free token by signing up at Hugging Face and accessing your account settings.

## Example: Streaming Chat Completion with Meta Llama 3.1 8B

This example demonstrates how to use the **Meta Llama 3.1 8B** model to perform a streaming chat completion:

```javascript
import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const inference = new HfInference("hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

for await (const chunk of inference.chatCompletionStream({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [{ role: "user", content: "What is the capital of France?" }],
  max_tokens: 500,
})) {
  console.log(chunk.choices[0]?.delta?.content || "");
}
```

This will output the streamed response in real-time.

## Tree Shaking

You can import the specific functions you need from the module to enable tree-shaking in your bundler:

```javascript
import { chatCompletionStream } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const inference = new HfInference("hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

for await (const chunk of chatCompletionStream({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [{ role: "user", content: "What is the capital of France?" }],
  max_tokens: 500,
})) {
  console.log(chunk.choices[0]?.delta?.content || "");
}
```

## Using Chat Completion with the Meta Llama 3.1 8B Model

The following example demonstrates how to use the `chatCompletionStream` method to interact with the **Meta Llama 3.1 8B** model:

```javascript
import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.8.1/+esm';

const inference = new HfInference("hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

for await (const chunk of inference.chatCompletionStream({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [{ role: "user", content: "What is the capital of France?" }],
  max_tokens: 500,
})) {
  console.log(chunk.choices[0]?.delta?.content || "");
}
```

The response is streamed and handled chunk by chunk, giving you real-time updates for large responses.

# Parameters

API specification
Request
Payload		
frequency_penalty	number	Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model’s likelihood to repeat the same line verbatim.
logprobs	boolean	Whether to return log probabilities of the output tokens or not. If true, returns the log probabilities of each output token returned in the content of message.
max_tokens	integer	The maximum number of tokens that can be generated in the chat completion.
messages*	object[]	A list of messages comprising the conversation so far.
        content*	unknown	One of the following:
                 (#1)	string	
                 (#2)	object[]	
                         (#1)	object	
                                text*	string	
                                type*	enum	Possible values: text.
                         (#2)	object	
                                image_url*	object	
                                        url*	string	
                                type*	enum	Possible values: image_url.
        name	string	
        role*	string	
presence_penalty	number	Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model’s likelihood to talk about new topics
response_format	unknown	One of the following:
         (#1)	object	
                type*	enum	Possible values: json.
                value*	unknown	A string that represents a JSON Schema. JSON Schema is a declarative language that allows to annotate JSON documents with types and descriptions.
         (#2)	object	
                type*	enum	Possible values: regex.
                value*	string	
seed	integer	
stop	string[]	Up to 4 sequences where the API will stop generating further tokens.
stream	boolean	
stream_options	object	
        include_usage*	boolean	If set, an additional chunk will be streamed before the data: [DONE] message. The usage field on this chunk shows the token usage statistics for the entire request, and the choices field will always be an empty array. All other chunks will also include a usage field, but with a null value.
temperature	number	What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. We generally recommend altering this or top_p but not both.
tool_choice	unknown	One of the following:
         (#1)	object	
         (#2)	string	
         (#3)	object	
                function*	object	
                        name*	string	
         (#4)	object	
tool_prompt	string	A prompt to be appended before the tools
tools	object[]	A list of tools the model may call. Currently, only functions are supported as a tool. Use this to provide a list of functions the model may generate JSON inputs for.
        function*	object	
                arguments*	unknown	
                description	string	
                name*	string	
        type*	string	
top_logprobs	integer	An integer between 0 and 5 specifying the number of most likely tokens to return at each token position, each with an associated log probability. logprobs must be set to true if this parameter is used.
top_p	number	An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
Some options can be configured by passing headers to the Inference API. Here are the available headers:

Headers		
authorization	string	Authentication header in the form 'Bearer: hf_****' when hf_**** is a personal user access token with Inference API permission. You can generate one from your settings page.
x-use-cache	boolean, default to true	There is a cache layer on the inference API to speed up requests we have already seen. Most models can use those results as they are deterministic (meaning the outputs will be the same anyway). However, if you use a nondeterministic model, you can set this parameter to prevent the caching mechanism from being used, resulting in a real new query. Read more about caching here.
x-wait-for-model	boolean, default to false	If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error, as it will limit hanging in your application to known places. Read more about model availability here.
For more information about Inference API headers, check out the parameters guide.

Response
Output type depends on the stream input parameter. If stream is false (default), the response will be a JSON object with the following fields:

Body		
choices	object[]	
        finish_reason	string	
        index	integer	
        logprobs	object	
                content	object[]	
                        logprob	number	
                        token	string	
                        top_logprobs	object[]	
                                logprob	number	
                                token	string	
        message	unknown	One of the following:
                 (#1)	object	
                        content	string	
                        role	string	
                 (#2)	object	
                        role	string	
                        tool_calls	object[]	
                                function	object	
                                        arguments	unknown	
                                        description	string	
                                        name	string	
                                id	string	
                                type	string	
created	integer	
id	string	
model	string	
system_fingerprint	string	
usage	object	
        completion_tokens	integer	
        prompt_tokens	integer	
        total_tokens	integer	
If stream is true, generated tokens are returned as a stream, using Server-Sent Events (SSE). For more information about streaming, check out this guide.

Body		
choices	object[]	
        delta	unknown	One of the following:
                 (#1)	object	
                        content	string	
                        role	string	
                 (#2)	object	
                        role	string	
                        tool_calls	object	
                                function	object	
                                        arguments	string	
                                        name	string	
                                id	string	
                                index	integer	
                                type	string	
        finish_reason	string	
        index	integer	
        logprobs	object	
                content	object[]	
                        logprob	number	
                        token	string	
                        top_logprobs	object[]	
                                logprob	number	
                                token	string	
created	integer	
id	string	
model	string	
system_fingerprint	string	
usage	object	
        completion_tokens	integer	
        prompt_tokens	integer	
        total_tokens	integer	