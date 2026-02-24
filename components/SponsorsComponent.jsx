import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { getApi, getApiBaseUrl } from 'coffeebreak/event-app';
import { createPortal } from 'react-dom';

export default function Sponsors({
  display_sponsor_level = false,
  display_sponsor_website = false,
  display_sponsor_description = false,
  display_search = true
}) {
  const [sponsors, setSponsors] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalSponsor, setModalSponsor] = useState(null);
  const [search, setSearch] = useState('');
  const modalRef = useRef(null);

  const api = getApi();

  // Fetch sponsors and levels data using axios
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch sponsors and levels in parallel
        const [sponsorsResponse, levelsResponse] = await Promise.all([
          api.get(`/sponsors-promotion-plugin/sponsors/`),
          api.get(`/sponsors-promotion-plugin/sponsors/levels/`)
        ]);

        // Set state with the response data
        setSponsors(Array.isArray(sponsorsResponse.data) ? sponsorsResponse.data : []);
        setLevels(Array.isArray(levelsResponse.data) ? levelsResponse.data : []);
        setError(null);
      } catch (err) {
        console.error("Error fetching sponsors data:", err);
        setError("Failed to load sponsors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter sponsors by search
  const filteredSponsors = sponsors.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  // Sort sponsors by name
  const sortedSponsors = [...filteredSponsors].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
  const sponsorsByLevel = levels.map(level => ({
    ...level,
    sponsors: sortedSponsors.filter(sponsor => sponsor.level_id === level.id)
  }));

  // Loading state
  if (loading) {
    return (
      <div className={`bg-base-100 rounded-lg shadow-md overflow-hidden p-8`}>
        <div className="loading loading-spinner text-primary mx-auto"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-base-100 rounded-lg shadow-md overflow-hidden`}>
        <div className="alert alert-error m-4">{error}</div>
      </div>
    );
  }

  // No sponsors state
  if (sortedSponsors.length === 0) {
    return (
      <div className="bg-base-100 rounded-lg shadow-md overflow-hidden p-8 text-center">
        {display_search && (
          <div className="mb-4 max-w-md mx-auto">
            <input
              type="text"
              className="input input-bordered w-full rounded-xl"
              placeholder="Search sponsors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
        <p className="text-base-content/70">No sponsors are currently available.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden`}>
      <div className="p-4">
        {display_search && (
          <div className="mb-4 max-w-md mx-auto">
            <input
              type="text"
              className="input input-bordered w-full rounded-xl"
              placeholder="Search sponsors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
        {display_sponsor_level && levels.length > 0 ? (
          <div className="space-y-10">
            {sponsorsByLevel.map(level => (
              <div key={level.id} className="sponsor-level">
                <h3 className="text-xl font-semibold mb-6 text-center text-primary">{level.name}</h3>
                {level.sponsors.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-6">
                    {level.sponsors.map(sponsor => (
                      <SponsorLogo
                        key={sponsor.id}
                        name={sponsor.name}
                        logo={sponsor.logo_url}
                        website={sponsor.website_url}
                        description={sponsor.description}
                        displayDescription={display_sponsor_description}
                        displayWebsite={display_sponsor_website}
                        onClick={() => setModalSponsor(sponsor)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-base-content/50 py-4">No sponsors in this level</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {sortedSponsors.map(sponsor => (
              <SponsorLogo
                key={sponsor.id}
                name={sponsor.name}
                logo={sponsor.logo_url}
                website={sponsor.website_url}
                description={sponsor.description}
                displayDescription={display_sponsor_description}
                displayWebsite={display_sponsor_website}
                onClick={() => setModalSponsor(sponsor)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Sponsor Description Modal */}
      {modalSponsor && createPortal(
        <dialog ref={modalRef} className="modal modal-middle" open onClose={() => setModalSponsor(null)}>
          <div className="modal-box max-w-md w-[90vw]">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => { setModalSponsor(null); modalRef.current?.close(); }}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">{modalSponsor.name}</h2>
            <p className="text-base-content mb-2">{modalSponsor.description}</p>
            {modalSponsor.website_url && (
              <a
                href={modalSponsor.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary flex items-center gap-1 mt-4"
              >
                <ExternalLink size={16} />
                Visit Website
              </a>
            )}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>,
        document.body
      )}
    </div>
  );
}

function SponsorLogo({
  name,
  logo,
  website,
  displayDescription,
  displayWebsite,
  onClick
}) {
  const logoWidth = "w-38 md:w-48";
  // Helper: split text into lines for SVG word wrap (max 2 lines, ellipsis if needed)
  function wrapText(text, maxCharsPerLine = 16, maxLines = 2) {
    if (!text) return [];

    function addEllipsis(line, maxLen) {
      return line.length > maxLen ? line.slice(0, maxLen - 1) + '...' : line;
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (lines.length + 1 === maxLines) {
          lines.push(addEllipsis(testLine, maxCharsPerLine));
          return lines;
        }
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }
  const base100 = 'var(--color-base-100)';
  const baseContent = 'var(--color-base-content)';
  const wrappedLines = wrapText(name);
  const placeholderDataUri = (() => {
    let svg = `<svg width='200' height='100' xmlns='http://www.w3.org/2000/svg'>`;
    svg += `<rect width='200' height='100' fill='${base100}'/>`;
    svg += `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='${baseContent}' font-size='20' font-family='Arial, sans-serif' font-weight='bold'>`;
    if (wrappedLines.length === 1) {
      svg += `<tspan x='50%' dy='0em'>${wrappedLines[0]}</tspan>`;
    } else {
      svg += `<tspan x='50%' dy='-0.6em'>${wrappedLines[0]}</tspan>`;
      svg += `<tspan x='50%' dy='1.2em'>${wrappedLines[1]}</tspan>`;
    }
    svg += `</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  })();

  const getLogoSrc = (logo) => {
    if (!logo || logo === '') {
      return placeholderDataUri;
    }
    if (logo.includes('http')) {
      return logo;
    }
    return `${getApiBaseUrl()}/media/${logo}`;
  };

  const logoSrc = getLogoSrc(logo);

  // Unified card appearance
  const handleClick = (e) => {
    if (displayDescription) {
      onClick && onClick();
    } else if (displayWebsite && website) {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`sponsor-logo flex flex-col items-center justify-center gap-2 ${logoWidth} cursor-pointer`}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      title={name}
      aria-label={name}
    >
      <div className="h-24 flex items-center justify-center w-full">
        <img
          src={logoSrc}
          alt={`${name} logo`}
          className="max-h-24 max-w-full object-contain"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholderDataUri;
          }}
        />
      </div>
      {/* Optionally show name below logo if desired */}
      {/* <p className="text-sm font-medium text-center">{name}</p> */}
    </div>
  );
}

// PropTypes
Sponsors.propTypes = {
  display_sponsor_level: PropTypes.bool,
  display_sponsor_website: PropTypes.bool,
  display_sponsor_description: PropTypes.bool,
  display_search: PropTypes.bool
};

SponsorLogo.propTypes = {
  name: PropTypes.string.isRequired,
  logo: PropTypes.string.isRequired,
  website: PropTypes.string,
  displayDescription: PropTypes.bool,
  displayWebsite: PropTypes.bool,
  onClick: PropTypes.func
};
