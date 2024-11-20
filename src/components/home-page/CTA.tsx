// React and Next.js imports
// Third-party library imports
import Balancer from "react-wrap-balancer";

// UI component imports
import { Button } from "@/components/ui/button";

// Custom components
import { Section, Container } from "@/components/craft";

const Cta = () => {
  return (
    <Section className="px-4">
      <Container className="flex flex-col items-center gap-6 rounded-lg border bg-accent/50 p-6 text-center md:rounded-xl md:p-12">
        <h2 className="!my-0">Lets get started!</h2>
        <h3 className="!mb-0 text-muted-foreground">
          <Balancer>
            This is where we gonna have the button to move to the visualiser.
            This is the CTA.
          </Balancer>
        </h3>
        <div className="not-prose mx-auto flex items-center gap-2">
          <Button className="w-fit" asChild>
            <a href="#">Get Started</a>
          </Button>
          <Button className="w-fit" variant="link" asChild>
            <a href="#">Learn More {"->"}</a>
          </Button>
        </div>
      </Container>
    </Section>
  );
};

export default Cta;