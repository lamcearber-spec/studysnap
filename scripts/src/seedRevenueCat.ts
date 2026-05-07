import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "StudySnap";

const APP_STORE_APP_NAME = "StudySnap iOS";
const APP_STORE_BUNDLE_ID = "com.studysnap.app";
const PLAY_STORE_APP_NAME = "StudySnap Android";
const PLAY_STORE_PACKAGE_NAME = "com.studysnap.app";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

type StoreName = "test" | "appStore" | "playStore";
type Tier = "starter" | "premium";

type ProductSeed = {
  identifier: string;
  playStoreIdentifier: string;
  displayName: string;
  title: string;
  duration: "P1M" | "P1Y";
  tier: Tier;
  prices: { amount_micros: number; currency: string }[];
};

type SeededProduct = Record<StoreName, Product>;

type PackageSeed = {
  identifier: string;
  displayName: string;
  productIdentifier: string;
};

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    identifier: "studysnap_starter_monthly",
    playStoreIdentifier: "studysnap_starter_monthly:monthly",
    displayName: "StudySnap Starter",
    title: "StudySnap Starter Monthly",
    duration: "P1M",
    tier: "starter",
    prices: [{ amount_micros: 4_990_000, currency: "USD" }],
  },
  {
    identifier: "studysnap_starter_annual",
    playStoreIdentifier: "studysnap_starter_annual:annual",
    displayName: "StudySnap Starter",
    title: "StudySnap Starter Annual",
    duration: "P1Y",
    tier: "starter",
    prices: [{ amount_micros: 49_900_000, currency: "USD" }],
  },
  {
    identifier: "studysnap_premium_monthly",
    playStoreIdentifier: "studysnap_premium_monthly:monthly",
    displayName: "StudySnap Premium",
    title: "StudySnap Premium Monthly",
    duration: "P1M",
    tier: "premium",
    prices: [{ amount_micros: 9_990_000, currency: "USD" }],
  },
  {
    identifier: "studysnap_premium_annual",
    playStoreIdentifier: "studysnap_premium_annual:annual",
    displayName: "StudySnap Premium",
    title: "StudySnap Premium Annual",
    duration: "P1Y",
    tier: "premium",
    prices: [{ amount_micros: 99_900_000, currency: "USD" }],
  },
];

const PACKAGE_SEEDS: PackageSeed[] = [
  { identifier: "$rc_monthly", displayName: "Starter Monthly", productIdentifier: "studysnap_starter_monthly" },
  { identifier: "$rc_annual", displayName: "Starter Annual", productIdentifier: "studysnap_starter_annual" },
  { identifier: "premium_monthly", displayName: "Premium Monthly", productIdentifier: "studysnap_premium_monthly" },
  { identifier: "premium_annual", displayName: "Premium Annual", productIdentifier: "studysnap_premium_annual" },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

function isAlreadyExists(error: unknown) {
  return Boolean(error && typeof error === "object" && "type" in error && error["type"] === "resource_already_exists");
}

function isUnprocessable(error: unknown) {
  return Boolean(error && typeof error === "object" && "type" in error && error["type"] === "unprocessable_entity_error");
}

async function ensureProject(client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>) {
  const { data: existingProjects, error } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (error) throw new Error("Failed to list projects");

  const existing = existingProjects.items?.find((project) => project.name === PROJECT_NAME);
  if (existing) return existing;

  const created = await createProject({ client, body: { name: PROJECT_NAME } });
  if (created.error) throw new Error("Failed to create project");
  return created.data;
}

async function ensureApps(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
) {
  const { data: apps, error } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (error || !apps) throw new Error("Failed to list apps");

  const test = apps.items.find((app) => app.type === "test_store");
  if (!test) throw new Error("No test store app found");

  let appStore = apps.items.find((app) => app.type === "app_store");
  if (!appStore) {
    const created = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (created.error) throw new Error("Failed to create App Store app");
    appStore = created.data;
  }

  let playStore = apps.items.find((app) => app.type === "play_store");
  if (!playStore) {
    const created = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (created.error) throw new Error("Failed to create Play Store app");
    playStore = created.data;
  }

  return { test, appStore, playStore };
}

async function ensureProduct(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  app: App,
  seed: ProductSeed,
  storeIdentifier: string,
  isTestStore: boolean,
  existingProducts: Product[],
) {
  const existing = existingProducts.find(
    (product) => product.app_id === app.id && product.store_identifier === storeIdentifier,
  );
  if (existing) return existing;

  const body: CreateProductData["body"] = {
    store_identifier: storeIdentifier,
    app_id: app.id,
    type: "subscription",
    display_name: seed.displayName,
  };

  if (isTestStore) {
    body.subscription = { duration: seed.duration };
    body.title = seed.title;
  }

  const created = await createProduct({
    client,
    path: { project_id: project.id },
    body,
  });
  if (created.error) throw new Error(`Failed to create product ${storeIdentifier}`);
  existingProducts.push(created.data);
  return created.data;
}

async function setTestStorePrices(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  product: Product,
  seed: ProductSeed,
) {
  const { error } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: project.id, product_id: product.id },
    body: { prices: seed.prices },
  });

  if (error && !isAlreadyExists(error)) {
    throw new Error(`Failed to add test store prices for ${seed.identifier}`);
  }
}

async function ensureEntitlement(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  tier: Tier,
) {
  const { data: existingEntitlements, error } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (error) throw new Error("Failed to list entitlements");

  const existing = existingEntitlements.items?.find((entitlement) => entitlement.lookup_key === tier);
  if (existing) return existing;

  const created = await createEntitlement({
    client,
    path: { project_id: project.id },
    body: {
      lookup_key: tier,
      display_name: tier === "premium" ? "Premium Access" : "Starter Access",
    },
  });
  if (created.error) throw new Error(`Failed to create ${tier} entitlement`);
  return created.data;
}

async function attachEntitlementProducts(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  entitlement: Entitlement,
  products: Product[],
) {
  const { error } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: products.map((product) => product.id) },
  });
  if (error && !isUnprocessable(error)) {
    throw new Error(`Failed to attach products to entitlement ${entitlement.lookup_key}`);
  }
}

async function ensureOffering(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
) {
  const { data: existingOfferings, error } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (error) throw new Error("Failed to list offerings");

  let offering: Offering | undefined = existingOfferings.items?.find(
    (item) => item.lookup_key === OFFERING_IDENTIFIER,
  );
  if (!offering) {
    const created = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (created.error) throw new Error("Failed to create offering");
    offering = created.data;
  }

  if (!offering.is_current) {
    const updated = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (updated.error) throw new Error("Failed to set offering as current");
  }

  return offering;
}

async function ensurePackage(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  offering: Offering,
  seed: PackageSeed,
) {
  const { data: existingPackages, error } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 50 },
  });
  if (error) throw new Error("Failed to list packages");

  const existing = existingPackages.items?.find((pkg) => pkg.lookup_key === seed.identifier);
  if (existing) return existing;

  const created = await createPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    body: { lookup_key: seed.identifier, display_name: seed.displayName },
  });
  if (created.error) throw new Error(`Failed to create package ${seed.identifier}`);
  return created.data;
}

async function attachPackageProducts(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  project: Project,
  pkg: Package,
  products: SeededProduct,
) {
  const { error } = await attachProductsToPackage({
    client,
    path: { project_id: project.id, package_id: pkg.id },
    body: {
      products: [
        { product_id: products.test.id, eligibility_criteria: "all" },
        { product_id: products.appStore.id, eligibility_criteria: "all" },
        { product_id: products.playStore.id, eligibility_criteria: "all" },
      ],
    },
  });
  if (error && !isUnprocessable(error)) {
    throw new Error(`Failed to attach products to package ${pkg.lookup_key}`);
  }
}

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();
  const project = await ensureProject(client);
  const apps = await ensureApps(client, project);

  const { data: productList, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");
  const existingProducts = [...(productList.items ?? [])];

  const productsByIdentifier = new Map<string, SeededProduct>();
  for (const seed of PRODUCT_SEEDS) {
    const test = await ensureProduct(client, project, apps.test, seed, seed.identifier, true, existingProducts);
    await setTestStorePrices(client, project, test, seed);
    const appStore = await ensureProduct(client, project, apps.appStore, seed, seed.identifier, false, existingProducts);
    const playStore = await ensureProduct(
      client,
      project,
      apps.playStore,
      seed,
      seed.playStoreIdentifier,
      false,
      existingProducts,
    );
    productsByIdentifier.set(seed.identifier, { test, appStore, playStore });
  }

  for (const tier of ["starter", "premium"] as Tier[]) {
    const entitlement = await ensureEntitlement(client, project, tier);
    const tierProducts = PRODUCT_SEEDS
      .filter((seed) => seed.tier === tier)
      .flatMap((seed) => Object.values(productsByIdentifier.get(seed.identifier) ?? {}));
    await attachEntitlementProducts(client, project, entitlement, tierProducts);
  }

  const offering = await ensureOffering(client, project);
  for (const seed of PACKAGE_SEEDS) {
    const pkg = await ensurePackage(client, project, offering, seed);
    const products = productsByIdentifier.get(seed.productIdentifier);
    if (!products) throw new Error(`Missing products for package ${seed.identifier}`);
    await attachPackageProducts(client, project, pkg, products);
  }

  const { data: testKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: apps.test.id } });
  const { data: iosKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: apps.appStore.id } });
  const { data: androidKeys } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: apps.playStore.id } });

  console.log("\n====================");
  console.log("RevenueCat setup complete");
  console.log("Project ID:", project.id);
  console.log("Entitlements: starter, premium");
  console.log("Offering:", OFFERING_IDENTIFIER);
  console.log("\nApp Store Connect product IDs to create manually:");
  PRODUCT_SEEDS.forEach((seed) => console.log("-", seed.identifier));
  console.log("\nEXPO_PUBLIC_REVENUECAT_TEST_API_KEY =", testKeys?.items?.[0]?.key ?? "N/A");
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY =", iosKeys?.items?.[0]?.key ?? "N/A");
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY =", androidKeys?.items?.[0]?.key ?? "N/A");
  console.log("REVENUECAT_PROJECT_ID =", project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID =", apps.test.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID =", apps.appStore.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID =", apps.playStore.id);
  console.log("====================\n");
}

seedRevenueCat().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
