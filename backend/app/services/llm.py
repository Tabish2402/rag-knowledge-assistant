import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


def generate_answer(prompt: str):
    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a grounded document question-answering assistant. "
                    "Answer questions using ONLY the supplied document context. "
                    "Never invent information."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return response.choices[0].message.content


def generate_answer_stream(prompt: str):
    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a grounded document question-answering assistant. "
                    "Answer questions using ONLY the supplied document context. "
                    "Never invent information."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        stream=True,
    )

    for chunk in response:
        content = chunk.choices[0].delta.content

        if content:
            yield content