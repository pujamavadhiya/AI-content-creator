import os
import re
import logging
from typing import Dict, Any, Optional
from pathlib import Path
import httpx
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

class ImageService:
    """
    Optional AI Image Generation Service powered by OpenAI DALL-E 3.
    Generates high-converting, relatable featured images for blogs and articles.
    """

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR) / "images"
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_openai_key(self, custom_key: Optional[str] = None) -> Optional[str]:
        """Resolve OpenAI API key from request parameter or environment."""
        if custom_key and custom_key.strip():
            return custom_key.strip()
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
            return settings.OPENAI_API_KEY.strip()
        # Check system env directly
        return os.getenv("OPENAI_API_KEY")

    def create_image_prompt_from_blog(
        self,
        blog_title: str,
        blog_body: str,
        visual_style: str = "modern minimalist 3d isometric editorial illustration"
    ) -> str:
        """
        Synthesize a crisp, relatable visual prompt from blog title and content.
        Avoids text rendering flaws, focusing on conceptual metaphors.
        """
        clean_title = re.sub(r"[#*`]", "", blog_title).strip()
        
        # Extract main theme keywords
        words = [w for w in clean_title.split() if len(w) > 3 and w.lower() not in ("guide", "complete", "overview", "introduction", "best", "practices")]
        core_theme = " ".join(words[:4]) or clean_title

        prompt = (
            f"A high-end, clean {visual_style} depicting the concept of {core_theme}. "
            f"Elegant lighting, soft ambient glow, sophisticated color palette with slate navy, indigo, and subtle emerald accents. "
            f"Abstract tech visualization, no text, no letters, no distorted human faces, professional corporate technology editorial aesthetic, 8k resolution feel."
        )
        return prompt

    async def generate_image(
        self,
        blog_title: str,
        blog_body: str,
        custom_prompt: Optional[str] = None,
        visual_style: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        model: str = "dall-e-3",
        size: str = "1024x1024"
    ) -> Dict[str, Any]:
        """
        Generate a relatable blog header image using OpenAI DALL-E 3.
        """
        api_key = self._resolve_openai_key(openai_api_key)

        if not api_key:
            return {
                "success": False,
                "error": "OpenAI API Key is required for image generation. Please provide your OpenAI API key or add OPENAI_API_KEY to your .env file.",
                "requires_key": True
            }

        # Craft prompt
        style = visual_style or "modern minimalist 3d isometric editorial illustration"
        prompt = custom_prompt if custom_prompt and custom_prompt.strip() else self.create_image_prompt_from_blog(blog_title, blog_body, style)

        try:
            client = AsyncOpenAI(api_key=api_key)
            logger.info(f"Generating image with OpenAI DALL-E 3. Prompt: {prompt[:120]}...")

            response = await client.images.generate(
                model=model,
                prompt=prompt,
                size=size,
                quality="standard",
                n=1
            )

            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt or prompt

            # Download and save image locally so it persists
            local_filename = f"blog_img_{abs(hash(prompt)) % 1000000}.png"
            local_path = self.upload_dir / local_filename
            local_url = f"/uploads/images/{local_filename}"

            try:
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    img_res = await http_client.get(image_url)
                    if img_res.status_code == 200:
                        with open(local_path, "wb") as f:
                            f.write(img_res.content)
            except Exception as dl_err:
                logger.warning(f"Could not download image locally, using remote URL: {dl_err}")
                local_url = image_url

            alt_text = f"Featured Illustration: {blog_title}"

            return {
                "success": True,
                "image_url": image_url,
                "local_url": local_url,
                "revised_prompt": revised_prompt,
                "alt_text": alt_text,
                "prompt_used": prompt,
                "embedded_markdown": f"![{alt_text}]({image_url})\n\n",
            }
        except Exception as e:
            error_str = str(e)
            logger.error(f"OpenAI Image generation failed: {error_str}")
            return {
                "success": False,
                "error": f"OpenAI DALL-E error: {error_str}",
                "requires_key": False
            }

    def attach_image_to_markdown(self, markdown_text: str, image_url: str, alt_text: str) -> str:
        """
        Embed the generated image into the blog markdown directly below the H1 heading.
        """
        image_markdown = f"![{alt_text}]({image_url})\n\n"
        
        # If there's an H1 tag at the top, insert right after H1
        lines = markdown_text.splitlines()
        for i, line in enumerate(lines):
            if line.startswith("# ") and not line.startswith("## "):
                lines.insert(i + 1, "")
                lines.insert(i + 2, image_markdown.strip())
                return "\n".join(lines)

        # Otherwise prepend to beginning
        return image_markdown + markdown_text

image_service = ImageService()

