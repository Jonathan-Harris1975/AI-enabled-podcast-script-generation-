    storeSection(sessionId, 'intro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Intro error:', error.message);
    res.status(500).json({ error: 'Intro generation failed', details: error.message });
  }
});

export default router;      } catch (err) {
        console.warn('Weather fetch failed in /intro:', err.message);
      }
    }

    const quote = getRandomQuote();
    if (quote) {
      promptContent += `\n\nQuote of the day: "${quote}" — Alan Turing`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a witty British podcast host.' },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'intro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Intro error:', error.message);
    res.status(500).json({ error: 'Intro generation failed', details: error.message });
  }
});

export default router;
