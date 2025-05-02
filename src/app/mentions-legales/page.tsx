export default function MentionsLegales() {
    return (
      <main className="container mx-auto p-6 max-w-screen-md text-gray-800">
        <h1 className="text-3xl font-bold mb-4">Mentions légales</h1>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
          <p><strong>Nom de l’entreprise :</strong> NFT PROPULSION</p>
          <p><strong>Forme juridique :</strong> Entreprise Unipersonnelle à Responsabilité Limitée (EURL)</p>
          <p><strong>Capital social :</strong> 3 000 €</p>
          <p><strong>Siège social :</strong> 17 Courtil du Bourgenoux, 35520 La Chapelle-des-Fougeretz, France</p>
          <p><strong>SIREN :</strong> 927 618 702</p>
          <p><strong>SIRET :</strong> 92761870200017</p>
          <p><strong>Code APE / NAF :</strong> 62.01Z – Programmation informatique</p>
          <p><strong>RCS :</strong> Rennes</p>
          <p><strong>TVA intracommunautaire :</strong> FR32927618702</p>
          <p><strong>Directeur de la publication :</strong> Yoann Radenac</p>
          <p><strong>Contact :</strong> <a href="mailto:contact@nftpropulsion.fr" className="text-blue-600">contact@nftpropulsion.fr</a></p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Hébergement</h2>
          <p><strong>Hébergeur :</strong> Vercel Inc.</p>
          <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
          <p><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">https://vercel.com</a></p>
          <p>Email : support@vercel.com</p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Propriété intellectuelle</h2>
          <p>
            Le contenu du site authentart.com, incluant, de façon non limitative, les graphismes, images, textes, vidéos,
            animations, sons, logos, gifs et icônes ainsi que leur mise en forme sont la propriété exclusive de NFT PROPULSION,
            à l’exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
          </p>
          <p>
            Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle,
            de ces différents éléments est strictement interdite sans l’accord écrit de NFT PROPULSION.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Limitation de responsabilité</h2>
          <p>
            Les informations présentes sur ce site sont aussi précises que possible et le site est périodiquement remis à jour,
            mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une lacune, erreur
            ou ce qui semble être un dysfonctionnement, merci de bien vouloir le signaler par email à l’adresse suivante :
            <a href="mailto:contact@nftpropulsion.fr" className="text-blue-600"> contact@nftpropulsion.fr</a>.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Protection des données personnelles</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d’un droit d’accès,
            de rectification, d’opposition, de suppression et de portabilité de vos données personnelles.
          </p>
          <p>
            Aucune donnée personnelle n’est collectée à votre insu. Les données éventuellement collectées (par exemple via
            un portefeuille crypto ou un formulaire) sont utilisées exclusivement par NFT PROPULSION et ne sont jamais cédées
            à des tiers.
          </p>
          <p>
            Vous pouvez exercer vos droits en nous contactant à l’adresse suivante : 
            <a href="mailto:contact@nftpropulsion.fr" className="text-blue-600"> contact@nftpropulsion.fr</a>.
          </p>
        </section>
  
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <p>
            Le site peut utiliser des cookies afin d’améliorer l’expérience utilisateur. L'utilisateur est informé que lors
            de ses visites sur le site, un cookie peut s’installer automatiquement sur son logiciel de navigation. 
            Il peut à tout moment désactiver ces cookies depuis les paramètres de son navigateur.
          </p>
        </section>
  
        <p className="text-sm text-gray-500 mt-8">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
      </main>
    );
  }
  