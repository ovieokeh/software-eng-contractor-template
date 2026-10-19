import { site } from "@/lib/site";
import { experienceHighlights } from "@/lib/experience-highlights";

export function ExperienceHighlights({ id = "experience" }: { id?: string }) {
  return (
    <section
      id={id}
      className="site-experience site-section"
      aria-labelledby={`${id}-heading`}
    >
      <div className="site-section-lead">
        <h2 id={`${id}-heading`}>The experience you get</h2>
        <p>Work directly with {site.brand.personName}.</p>
        <p>{site.experience.introduction}</p>
      </div>
      <ul className="site-experience-grid">
        {experienceHighlights.map((experience) => (
          <li key={experience.organisation}>
            <p className="site-experience-company">
              <a href={experience.url} target="_blank" rel="noreferrer">
                {experience.organisation}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
            <h3>{experience.environment}</h3>
            <p>{experience.summary}</p>
          </li>
        ))}
      </ul>
      <p className="site-experience-credit">{site.experience.credit}</p>
    </section>
  );
}
