/**
 * The air in the room: grain, paper tooth, and the way the light falls off
 * toward the edges. Purely decorative, and never in the way of a pointer.
 */
export default function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="atmosphere__tooth" />
      <div className="atmosphere__grain" />
      <div className="atmosphere__vignette" />
      <div className="atmosphere__dim" />
    </div>
  );
}
