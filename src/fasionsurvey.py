# ============================================================
# FASHION SURVEY ANALYSIS + MACHINE LEARNING
# ============================================================

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from pathlib import Path

from scipy.stats import chi2_contingency

from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score
)

from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler


# ============================================================
# 1. FILE PATH
# ============================================================

print("\n" + "=" * 70)
print("FASHION SURVEY ANALYSIS")
print("=" * 70)

# Folder containing this Python file
SCRIPT_DIR = Path(__file__).resolve().parent

# Project folder
PROJECT_DIR = SCRIPT_DIR.parent


# ------------------------------------------------------------
# Find CSV automatically
# ------------------------------------------------------------

possible_csv_names = [
    "FashionSurveyResponses_100_Datasets.csv",
    "FashionSurveyResponses_100_Datasets(2).csv"
]

possible_locations = []

for filename in possible_csv_names:

    possible_locations.append(PROJECT_DIR / filename)
    possible_locations.append(SCRIPT_DIR / filename)
    possible_locations.append(Path.cwd() / filename)


FILE_PATH = None

for path in possible_locations:

    if path.exists():
        FILE_PATH = path
        break


# ------------------------------------------------------------
# If CSV is not found
# ------------------------------------------------------------

if FILE_PATH is None:

    print("\n❌ ERROR: CSV FILE NOT FOUND")

    print("\nPython searched these locations:")

    for path in possible_locations:
        print("   ", path)

    print("\nPlease make sure your CSV is inside:")
    print(PROJECT_DIR)

    print("\nExpected filename:")
    print("FashionSurveyResponses_100_Datasets.csv")
    print("OR")
    print("FashionSurveyResponses_100_Datasets(2).csv")

    input("\nPress Enter to exit...")

    raise SystemExit


# Output file
OUTPUT_FILE = PROJECT_DIR / "Fashion_Analysis_Result.xlsx"


print("\n✅ CSV FOUND:")
print(FILE_PATH)

print("\n📊 Excel output will be saved to:")
print(OUTPUT_FILE)


# ============================================================
# 2. LOAD DATA
# ============================================================

try:

    df = pd.read_csv(FILE_PATH)

except Exception as error:

    print("\n❌ ERROR WHILE READING CSV:")
    print(error)

    input("\nPress Enter to exit...")

    raise SystemExit


print("\nCSV successfully loaded!")

print("\nOriginal shape:")
print(df.shape)

print("\nOriginal columns:")
print(df.columns.tolist())


# ============================================================
# 3. CLEAN COLUMN NAMES
# ============================================================

df.columns = (
    df.columns
    .astype(str)
    .str.strip()
)


# ============================================================
# 4. CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "summerProducts",
    "winterProducts",
    "discountPreference",
    "locality",
    "monthlyBudget",
    "favoriteBrands",
    "shoppingFrequency",
    "gender",
    "ageGroup",
    "shoppingTime",
    "submittedAt",
    "favoriteCategories",
    "nextPurchase",
    "purchaseFactor",
    "trendSource",
    "preferredFit",
    "nextColor",
    "city",
    "preferredSize",
    "outOfStockBehaviour",
    "shoppingMode",
    "shoppingSeason",
    "revisitReason",
    "occupation",
    "trendPurchaseSpeed",
    "trendFollower",
    "brandReason",
    "leastPurchased",
    "name",
    "favoriteColors"
]


missing_columns = [
    col for col in required_columns
    if col not in df.columns
]


if missing_columns:

    print("\n⚠️ Missing columns detected:")

    for col in missing_columns:
        print("   -", col)

    print(
        "\nThe analysis may not be able to use "
        "some features."
    )


# ============================================================
# 5. CHECK FIRST ROW
# ============================================================

print("\n" + "=" * 70)
print("CHECKING DATA")
print("=" * 70)

print("\nFirst row:")

print(df.iloc[0].to_dict())


# ============================================================
# 6. HANDLE MALFORMED FIRST ROW
# ============================================================

"""
The uploaded CSV contains a malformed first record.

The first record does not align properly with the column
headers. Instead of guessing values and creating incorrect
customer information, we remove that malformed record.

All properly aligned survey records are retained.
"""

if len(df) > 0:

    first_row = df.iloc[0]

    first_id = str(
        first_row.get("id", "")
    ).strip()

    # Normal synthetic IDs in the dataset look like:
    # synthetic_001, synthetic_002, etc.

    if not first_id.startswith("synthetic_"):

        print(
            "\n⚠️ Malformed first row detected."
        )

        print(
            "Removing malformed first row "
            "instead of creating incorrect data."
        )

        df = df.iloc[1:].reset_index(drop=True)

        print(
            "First row removed successfully."
        )


# ============================================================
# 7. CLEAN TEXT DATA
# ============================================================

for column in df.select_dtypes(
    include="object"
).columns:

    df[column] = (
        df[column]
        .astype(str)
        .str.strip()
    )


# Replace strings that represent missing values

df = df.replace(
    {
        "nan": np.nan,
        "None": np.nan,
        "": np.nan,
        "NA": np.nan,
        "N/A": np.nan
    }
)


# ============================================================
# 8. CLEAN KNOWN INCONSISTENCIES
# ============================================================

print("\n" + "=" * 70)
print("CLEANING DATA")
print("=" * 70)


# ------------------------------------------------------------
# CITY
# ------------------------------------------------------------

if "city" in df.columns:

    df["city"] = df["city"].replace(
        {
            "kolkata": "Kolkata",
            "KOLKATA": "Kolkata",
            "Calcutta": "Kolkata"
        }
    )


# ------------------------------------------------------------
# PRODUCT NAME
# ------------------------------------------------------------

if "nextPurchase" in df.columns:

    df["nextPurchase"] = (
        df["nextPurchase"]
        .replace(
            {
                "Shirts": "Shirt",
                "shirts": "Shirt",
                "Tshirts": "T-Shirt",
                "T-Shirts": "T-Shirt"
            }
        )
    )


# ------------------------------------------------------------
# OUT OF STOCK BEHAVIOR
# ------------------------------------------------------------

if "outOfStockBehaviour" in df.columns:

    df["outOfStockBehaviour"] = (
        df["outOfStockBehaviour"]
        .replace(
            {
                "Buy Similar Product":
                    "Buy another product"
            }
        )
    )


# ------------------------------------------------------------
# TREND FOLLOWER
# ------------------------------------------------------------

if "trendFollower" in df.columns:

    df["trendFollower"] = (
        df["trendFollower"]
        .replace(
            {
                "Often": "Yes"
            }
        )
    )


# ============================================================
# 9. REMOVE DUPLICATES
# ============================================================

before = len(df)

df = df.drop_duplicates()

after = len(df)

print(
    "\nDuplicates removed:",
    before - after
)


# ============================================================
# 10. MISSING VALUES
# ============================================================

print("\n" + "=" * 70)
print("MISSING VALUE CHECK")
print("=" * 70)

missing_values = df.isnull().sum()

print(missing_values)


# ============================================================
# 11. BASIC INFORMATION
# ============================================================

print("\n" + "=" * 70)
print("BASIC ANALYTICS")
print("=" * 70)

print("\nTotal customers:")

print(len(df))


# ------------------------------------------------------------
# Gender
# ------------------------------------------------------------

if "gender" in df.columns:

    print("\nGender:")

    print(
        df["gender"]
        .value_counts()
    )


# ------------------------------------------------------------
# Age
# ------------------------------------------------------------

if "ageGroup" in df.columns:

    print("\nAge Group:")

    print(
        df["ageGroup"]
        .value_counts()
    )


# ------------------------------------------------------------
# City
# ------------------------------------------------------------

if "city" in df.columns:

    print("\nCity:")

    print(
        df["city"]
        .value_counts()
    )


# ============================================================
# 12. PRODUCT DEMAND
# ============================================================

print("\n" + "=" * 70)
print("NEXT PURCHASE DEMAND")
print("=" * 70)


if "nextPurchase" in df.columns:

    product_demand = (
        df["nextPurchase"]
        .dropna()
        .value_counts()
    )

    print("\nProduct demand:")

    print(product_demand)


    product_percentage = (
        product_demand
        / len(df)
        * 100
    ).round(2)

    print("\nProduct percentage:")

    print(product_percentage)

else:

    product_demand = pd.Series(
        dtype="int64"
    )

    product_percentage = pd.Series(
        dtype="float64"
    )


# ============================================================
# 13. SUMMER PRODUCT ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("SUMMER PRODUCT DEMAND")
print("=" * 70)


if "summerProducts" in df.columns:

    summer_demand = (
        df["summerProducts"]
        .dropna()
        .value_counts()
    )

    print(summer_demand)

else:

    summer_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 14. WINTER PRODUCT ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("WINTER PRODUCT DEMAND")
print("=" * 70)


if "winterProducts" in df.columns:

    winter_demand = (
        df["winterProducts"]
        .dropna()
        .value_counts()
    )

    print(winter_demand)

else:

    winter_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 15. BRAND ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("BRAND ANALYSIS")
print("=" * 70)


if "favoriteBrands" in df.columns:

    brand_demand = (
        df["favoriteBrands"]
        .dropna()
        .value_counts()
    )

    print(brand_demand)

else:

    brand_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 16. CATEGORY ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("CATEGORY ANALYSIS")
print("=" * 70)


if "favoriteCategories" in df.columns:

    category_demand = (
        df["favoriteCategories"]
        .dropna()
        .value_counts()
    )

    print(category_demand)

else:

    category_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 17. PURCHASE FACTOR
# ============================================================

print("\n" + "=" * 70)
print("PURCHASE FACTOR")
print("=" * 70)


if "purchaseFactor" in df.columns:

    purchase_factor = (
        df["purchaseFactor"]
        .dropna()
        .value_counts()
    )

    print(purchase_factor)

else:

    purchase_factor = pd.Series(
        dtype="int64"
    )


# ============================================================
# 18. SIZE ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("SIZE PREFERENCE")
print("=" * 70)


if "preferredSize" in df.columns:

    size_demand = (
        df["preferredSize"]
        .dropna()
        .value_counts()
    )

    print(size_demand)

else:

    size_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 19. COLOR ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("COLOR PREFERENCE")
print("=" * 70)


if "nextColor" in df.columns:

    color_demand = (
        df["nextColor"]
        .dropna()
        .value_counts()
    )

    print(color_demand)

else:

    color_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 20. FIT ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("FIT PREFERENCE")
print("=" * 70)


if "preferredFit" in df.columns:

    fit_demand = (
        df["preferredFit"]
        .dropna()
        .value_counts()
    )

    print(fit_demand)

else:

    fit_demand = pd.Series(
        dtype="int64"
    )


# ============================================================
# 21. SHOPPING MODE
# ============================================================

print("\n" + "=" * 70)
print("SHOPPING MODE")
print("=" * 70)


if "shoppingMode" in df.columns:

    shopping_mode = (
        df["shoppingMode"]
        .dropna()
        .value_counts()
    )

    print(shopping_mode)

else:

    shopping_mode = pd.Series(
        dtype="int64"
    )


# ============================================================
# 22. OUT OF STOCK BEHAVIOR
# ============================================================

print("\n" + "=" * 70)
print("OUT OF STOCK BEHAVIOR")
print("=" * 70)


if "outOfStockBehaviour" in df.columns:

    stock_behavior = (
        df["outOfStockBehaviour"]
        .dropna()
        .value_counts()
    )

    print(stock_behavior)

else:

    stock_behavior = pd.Series(
        dtype="int64"
    )


# ============================================================
# 23. CROSS ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("CROSS ANALYSIS")
print("=" * 70)


def create_crosstab(column1, column2):

    if (
        column1 in df.columns
        and column2 in df.columns
    ):

        return pd.crosstab(
            df[column1],
            df[column2]
        )

    return pd.DataFrame()


# ------------------------------------------------------------
# City vs Product
# ------------------------------------------------------------

city_product = create_crosstab(
    "city",
    "nextPurchase"
)

print("\nCITY VS PRODUCT")

print(city_product)


# ------------------------------------------------------------
# Age vs Product
# ------------------------------------------------------------

age_product = create_crosstab(
    "ageGroup",
    "nextPurchase"
)

print("\nAGE VS PRODUCT")

print(age_product)


# ------------------------------------------------------------
# Season vs Product
# ------------------------------------------------------------

season_product = create_crosstab(
    "shoppingSeason",
    "nextPurchase"
)

print("\nSEASON VS PRODUCT")

print(season_product)


# ------------------------------------------------------------
# Category vs Product
# ------------------------------------------------------------

category_product = create_crosstab(
    "favoriteCategories",
    "nextPurchase"
)

print("\nCATEGORY VS PRODUCT")

print(category_product)


# ------------------------------------------------------------
# Brand vs Product
# ------------------------------------------------------------

brand_product = create_crosstab(
    "favoriteBrands",
    "nextPurchase"
)

print("\nBRAND VS PRODUCT")

print(brand_product)


# ============================================================
# 24. CHI-SQUARE TEST
# ============================================================

print("\n" + "=" * 70)
print("CHI-SQUARE TESTS")
print("=" * 70)


chi_square_results = []


def chi_square_analysis(
    column1,
    column2
):

    if (
        column1 not in df.columns
        or column2 not in df.columns
    ):

        return


    temp = df[
        [column1, column2]
    ].dropna()


    if (
        temp[column1].nunique() < 2
        or temp[column2].nunique() < 2
    ):

        return


    table = pd.crosstab(
        temp[column1],
        temp[column2]
    )


    try:

        chi2, p, dof, expected = (
            chi2_contingency(table)
        )

    except Exception:

        return


    relationship = (
        "Significant relationship"
        if p < 0.05
        else "No significant relationship"
    )


    print("\n--------------------------------")
    print(column1, "VS", column2)
    print("--------------------------------")

    print(
        "Chi-square:",
        round(chi2, 4)
    )

    print(
        "P-value:",
        round(p, 4)
    )

    print(
        relationship
    )


    chi_square_results.append(
        {
            "Variable 1": column1,
            "Variable 2": column2,
            "Chi-square": round(chi2, 4),
            "P-value": round(p, 4),
            "Result": relationship
        }
    )


chi_square_analysis(
    "shoppingSeason",
    "nextPurchase"
)

chi_square_analysis(
    "ageGroup",
    "nextPurchase"
)

chi_square_analysis(
    "gender",
    "nextPurchase"
)

chi_square_analysis(
    "favoriteCategories",
    "nextPurchase"
)

chi_square_analysis(
    "shoppingMode",
    "nextPurchase"
)

chi_square_analysis(
    "favoriteBrands",
    "nextPurchase"
)


chi_square_df = pd.DataFrame(
    chi_square_results
)


# ============================================================
# 25. VISUALIZATION
# ============================================================

print("\n" + "=" * 70)
print("CREATING VISUALIZATIONS")
print("=" * 70)


sns.set_theme(
    style="whitegrid"
)


# ------------------------------------------------------------
# Product Demand
# ------------------------------------------------------------

if len(product_demand) > 0:

    plt.figure(
        figsize=(10, 6)
    )

    sns.countplot(
        data=df,
        x="nextPurchase",
        order=product_demand.index
    )

    plt.title(
        "Next Purchase Demand"
    )

    plt.xlabel(
        "Product"
    )

    plt.ylabel(
        "Customers"
    )

    plt.xticks(
        rotation=45
    )

    plt.tight_layout()

    plt.show()


# ------------------------------------------------------------
# Category
# ------------------------------------------------------------

if len(category_demand) > 0:

    plt.figure(
        figsize=(10, 6)
    )

    sns.countplot(
        data=df,
        x="favoriteCategories",
        order=category_demand.index
    )

    plt.title(
        "Favorite Fashion Categories"
    )

    plt.xlabel(
        "Category"
    )

    plt.ylabel(
        "Customers"
    )

    plt.xticks(
        rotation=45
    )

    plt.tight_layout()

    plt.show()


# ------------------------------------------------------------
# Brand
# ------------------------------------------------------------

if len(brand_demand) > 0:

    plt.figure(
        figsize=(10, 6)
    )

    sns.countplot(
        data=df,
        x="favoriteBrands",
        order=brand_demand.index
    )

    plt.title(
        "Favorite Brands"
    )

    plt.xlabel(
        "Brand"
    )

    plt.ylabel(
        "Customers"
    )

    plt.xticks(
        rotation=45
    )

    plt.tight_layout()

    plt.show()


# ============================================================
# 26. CITY VS PRODUCT HEATMAP
# ============================================================

if not city_product.empty:

    plt.figure(
        figsize=(12, 7)
    )

    sns.heatmap(
        city_product,
        annot=True,
        fmt="d"
    )

    plt.title(
        "City vs Next Purchase"
    )

    plt.tight_layout()

    plt.show()


# ============================================================
# 27. MACHINE LEARNING
# ============================================================

print("\n" + "=" * 70)
print("MACHINE LEARNING")
print("=" * 70)


TARGET = "nextPurchase"


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
    "summerProducts",
    "winterProducts",
    "discountPreference",
    "locality",
    "monthlyBudget",
    "favoriteBrands",
    "shoppingFrequency",
    "gender",
    "ageGroup",
    "shoppingTime",
    "favoriteCategories",
    "purchaseFactor",
    "trendSource",
    "preferredFit",
    "nextColor",
    "city",
    "preferredSize",
    "outOfStockBehaviour",
    "shoppingMode",
    "shoppingSeason",
    "revisitReason",
    "occupation",
    "trendPurchaseSpeed",
    "trendFollower",
    "brandReason",
    "leastPurchased",
    "favoriteColors"
]


# Keep only columns actually present

FEATURES = [
    col
    for col in FEATURES
    if col in df.columns
]


print("\nFeatures being used:")

for feature in FEATURES:

    print(
        " -",
        feature
    )


# ============================================================
# 28. PREPARE ML DATA
# ============================================================

if TARGET not in df.columns:

    print(
        "\n❌ Target column 'nextPurchase' "
        "does not exist."
    )

    raise SystemExit


ml_data = df[
    FEATURES + [TARGET]
].copy()


# Remove rows where target is missing

ml_data = ml_data.dropna(
    subset=[TARGET]
)


X = ml_data[
    FEATURES
].copy()

y = ml_data[
    TARGET
].copy()


# Fill missing values

for column in X.columns:

    X[column] = (
        X[column]
        .fillna("Unknown")
        .astype(str)
    )


y = (
    y
    .fillna("Unknown")
    .astype(str)
)


print("\nML dataset shape:")

print(
    X.shape
)


print("\nTarget distribution:")

print(
    y.value_counts()
)


# ============================================================
# 29. ENCODING
# ============================================================

categorical_features = (
    X.select_dtypes(
        include=["object"]
    )
    .columns
    .tolist()
)


preprocessor = ColumnTransformer(

    transformers=[

        (
            "categorical",

            OneHotEncoder(
                handle_unknown="ignore"
            ),

            categorical_features
        )

    ],

    remainder="drop"
)


# ============================================================
# 30. RANDOM FOREST
# ============================================================

rf_model = Pipeline(

    steps=[

        (
            "preprocessor",

            preprocessor
        ),

        (
            "classifier",

            RandomForestClassifier(

                n_estimators=300,

                random_state=42,

                class_weight="balanced",

                min_samples_leaf=2

            )
        )

    ]
)


# ============================================================
# 31. TRAIN TEST SPLIT
# ============================================================

class_counts = y.value_counts()

minimum_class_count = (
    class_counts.min()
)


model_available = True


if len(y) < 5:

    print(
        "\n⚠️ Too few rows for ML."
    )

    model_available = False


elif minimum_class_count < 2:

    print(
        "\n⚠️ At least one product has "
        "only one record."
    )

    print(
        "Stratified train/test split cannot "
        "be performed safely."
    )

    model_available = False


if model_available:

    X_train, X_test, y_train, y_test = (
        train_test_split(

            X,

            y,

            test_size=0.20,

            random_state=42,

            stratify=y

        )
    )


    print(
        "\nTraining rows:",
        len(X_train)
    )

    print(
        "Testing rows:",
        len(X_test)
    )


    # ========================================================
    # 32. TRAIN MODEL
    # ========================================================

    print(
        "\nTraining Random Forest..."
    )


    rf_model.fit(
        X_train,
        y_train
    )


    print(
        "✅ Model trained successfully."
    )


    # ========================================================
    # 33. PREDICTION
    # ========================================================

    y_pred = rf_model.predict(
        X_test
    )


    # ========================================================
    # 34. ACCURACY
    # ========================================================

    accuracy = accuracy_score(
        y_test,
        y_pred
    )


    print(
        "\nModel Accuracy:"
    )


    print(
        round(
            accuracy * 100,
            2
        ),
        "%"
    )


    # ========================================================
    # 35. CLASSIFICATION REPORT
    # ========================================================

    print(
        "\nClassification Report:"
    )


    print(
        classification_report(

            y_test,

            y_pred,

            zero_division=0

        )
    )


    # ========================================================
    # 36. CONFUSION MATRIX
    # ========================================================

    cm = confusion_matrix(
        y_test,
        y_pred
    )


    plt.figure(
        figsize=(10, 8)
    )


    sns.heatmap(

        cm,

        annot=True,

        fmt="d"

    )


    plt.title(
        "Random Forest Confusion Matrix"
    )


    plt.xlabel(
        "Predicted Product"
    )


    plt.ylabel(
        "Actual Product"
    )


    plt.tight_layout()

    plt.show()


else:

    accuracy = np.nan

    y_pred = None

    cm = None


# ============================================================
# 37. CROSS VALIDATION
# ============================================================

cv_scores = np.array([])


if model_available:

    max_folds = int(
        minimum_class_count
    )


    n_splits = min(
        5,
        max_folds
    )


    if n_splits >= 2:

        print("\n" + "=" * 70)
        print(
            f"{n_splits}-FOLD CROSS VALIDATION"
        )
        print("=" * 70)


        cv = StratifiedKFold(

            n_splits=n_splits,

            shuffle=True,

            random_state=42

        )


        cv_scores = cross_val_score(

            rf_model,

            X,

            y,

            cv=cv,

            scoring="accuracy"

        )


        print(
            "\nFold accuracies:"
        )

        print(
            cv_scores
        )


        print(
            "\nAverage CV accuracy:",
            round(
                cv_scores.mean() * 100,
                2
            ),
            "%"
        )


# ============================================================
# 38. FEATURE IMPORTANCE
# ============================================================

importance_df = pd.DataFrame(
    columns=[
        "Feature",
        "Importance"
    ]
)


if model_available:

    print("\n" + "=" * 70)
    print("FEATURE IMPORTANCE")
    print("=" * 70)


    # Get fitted preprocessing step

    fitted_preprocessor = (
        rf_model
        .named_steps[
            "preprocessor"
        ]
    )


    # Transform X

    encoded_X = (
        fitted_preprocessor
        .transform(X)
    )


    feature_names = (
        fitted_preprocessor
        .get_feature_names_out()
    )


    # Get trained Random Forest

    trained_rf = (
        rf_model
        .named_steps[
            "classifier"
        ]
    )


    importance = (
        trained_rf
        .feature_importances_
    )


    importance_df = pd.DataFrame({

        "Feature":
            feature_names,

        "Importance":
            importance

    })


    importance_df = (
        importance_df
        .sort_values(
            "Importance",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )


    print(
        importance_df.head(20)
    )


    # ========================================================
    # FEATURE IMPORTANCE GRAPH
    # ========================================================

    top_features = (
        importance_df
        .head(15)
        .sort_values(
            "Importance"
        )
    )


    plt.figure(
        figsize=(10, 7)
    )


    sns.barplot(

        data=top_features,

        x="Importance",

        y="Feature"

    )


    plt.title(
        "Top Features for Purchase Prediction"
    )


    plt.tight_layout()

    plt.show()


# ============================================================
# 39. CUSTOMER SEGMENTATION
# ============================================================

print("\n" + "=" * 70)
print("CUSTOMER SEGMENTATION")
print("=" * 70)


cluster_available = False


try:

    # Transform data using the fitted encoder

    if model_available:

        encoded_cluster = (
            rf_model
            .named_steps[
                "preprocessor"
            ]
            .transform(X)
        )

    else:

        cluster_preprocessor = (
            ColumnTransformer(

                transformers=[

                    (
                        "categorical",

                        OneHotEncoder(
                            handle_unknown="ignore"
                        ),

                        categorical_features
                    )

                ]
            )
        )


        encoded_cluster = (
            cluster_preprocessor
            .fit_transform(X)
        )


    # Convert sparse matrix to array

    if hasattr(
        encoded_cluster,
        "toarray"
    ):

        encoded_array = (
            encoded_cluster.toarray()
        )

    else:

        encoded_array = (
            encoded_cluster
        )


    # ========================================================
    # STANDARDIZATION
    # ========================================================

    scaler = StandardScaler(
        with_mean=False
    )


    scaled_data = (
        scaler.fit_transform(
            encoded_array
        )
    )


    # ========================================================
    # ELBOW METHOD
    # ========================================================

    inertias = []

    max_k = min(
        7,
        len(df) - 1
    )


    if max_k >= 2:

        for k in range(
            2,
            max_k + 1
        ):

            km = KMeans(

                n_clusters=k,

                random_state=42,

                n_init=10

            )


            km.fit(
                scaled_data
            )


            inertias.append(
                km.inertia_
            )


        plt.figure(
            figsize=(8, 5)
        )


        plt.plot(

            range(
                2,
                max_k + 1
            ),

            inertias,

            marker="o"

        )


        plt.title(
            "Elbow Method"
        )


        plt.xlabel(
            "Number of Clusters"
        )


        plt.ylabel(
            "Inertia"
        )


        plt.tight_layout()

        plt.show()


    # ========================================================
    # CREATE 4 CLUSTERS
    # ========================================================

    number_of_clusters = min(
        4,
        len(df)
    )


    if number_of_clusters >= 2:

        kmeans = KMeans(

            n_clusters=number_of_clusters,

            random_state=42,

            n_init=10

        )


        cluster_labels = (
            kmeans
            .fit_predict(
                scaled_data
            )
        )


        # Add clusters only to matching ML rows

        ml_data["CustomerCluster"] = (
            cluster_labels
        )


        cluster_available = True


        print(
            "\nCustomers per cluster:"
        )


        print(
            pd.Series(
                cluster_labels
            )
            .value_counts()
            .sort_index()
        )


except Exception as error:

    print(
        "\n⚠️ Clustering could not be completed:"
    )

    print(error)


# ============================================================
# 40. CLUSTER PROFILES
# ============================================================

if cluster_available:

    print("\n" + "=" * 70)
    print("CLUSTER PROFILES")
    print("=" * 70)


    for cluster in sorted(
        ml_data[
            "CustomerCluster"
        ]
        .unique()
    ):

        cluster_data = ml_data[
            ml_data[
                "CustomerCluster"
            ]
            == cluster
        ]


        print(
            "\nCLUSTER",
            cluster
        )


        print(
            "Customers:",
            len(cluster_data)
        )


        if (
            "nextPurchase"
            in cluster_data.columns
            and len(cluster_data) > 0
        ):

            print(
                "Top product:",
                cluster_data[
                    "nextPurchase"
                ].mode().iloc[0]
            )


        if (
            "favoriteCategories"
            in cluster_data.columns
        ):

            print(
                "Top category:",
                cluster_data[
                    "favoriteCategories"
                ].mode().iloc[0]
            )


        if (
            "favoriteBrands"
            in cluster_data.columns
        ):

            print(
                "Top brand:",
                cluster_data[
                    "favoriteBrands"
                ].mode().iloc[0]
            )


        if (
            "shoppingMode"
            in cluster_data.columns
        ):

            print(
                "Shopping mode:",
                cluster_data[
                    "shoppingMode"
                ].mode().iloc[0]
            )


        if (
            "city"
            in cluster_data.columns
        ):

            print(
                "Top city:",
                cluster_data[
                    "city"
                ].mode().iloc[0]
            )


# ============================================================
# 41. PCA
# ============================================================

pca_available = False


try:

    if cluster_available:

        pca = PCA(
            n_components=2
        )


        pca_data = (
            pca.fit_transform(
                scaled_data
            )
        )


        ml_data["PCA1"] = (
            pca_data[:, 0]
        )

        ml_data["PCA2"] = (
            pca_data[:, 1]
        )


        print(
            "\nPCA explained variance:"
        )


        print(
            pca.explained_variance_ratio_
        )


        pca_available = True


except Exception as error:

    print(
        "\n⚠️ PCA could not be completed:"
    )

    print(error)


# ============================================================
# 42. PCA VISUALIZATION
# ============================================================

if pca_available:

    plt.figure(
        figsize=(10, 7)
    )


    sns.scatterplot(

        data=ml_data,

        x="PCA1",

        y="PCA2",

        hue="CustomerCluster",

        s=100

    )


    plt.title(
        "Customer Segmentation using PCA"
    )


    plt.tight_layout()

    plt.show()


# ============================================================
# 43. STOCK RECOMMENDATION
# ============================================================

print("\n" + "=" * 70)
print("STOCK RECOMMENDATION")
print("=" * 70)


stock_recommendations = []


if len(product_demand) > 0:

    total_customers = len(df)


    for product, count in (
        product_demand.items()
    ):

        percentage = (
            count
            / total_customers
            * 100
        )


        if percentage >= 15:

            recommendation = (
                "HIGH DEMAND - Increase stock"
            )


        elif percentage >= 10:

            recommendation = (
                "MEDIUM DEMAND - Maintain stock"
            )


        else:

            recommendation = (
                "LOW DEMAND - Monitor stock"
            )


        print(

            f"{product:20} "
            f"{count:3} customers "
            f"({percentage:5.1f}%) "
            f"→ {recommendation}"

        )


        stock_recommendations.append({

            "Product":
                product,

            "Customers":
                count,

            "Demand Percentage":
                round(
                    percentage,
                    2
                ),

            "Recommendation":
                recommendation

        })


stock_recommendation_df = pd.DataFrame(
    stock_recommendations
)


# ============================================================
# 44. SAMPLE CUSTOMER PREDICTION
# ============================================================

prediction_df = pd.DataFrame()


if model_available:

    print("\n" + "=" * 70)
    print("SAMPLE CUSTOMER PREDICTION")
    print("=" * 70)


    new_customer = pd.DataFrame({

        "summerProducts": [
            "T-Shirts"
        ],

        "winterProducts": [
            "Hoodies"
        ],

        "discountPreference": [
            "40%"
        ],

        "locality": [
            "Urban"
        ],

        "monthlyBudget": [
            "₹2,000-₹5,000"
        ],

        "favoriteBrands": [
            "Nike"
        ],

        "shoppingFrequency": [
            "Monthly"
        ],

        "gender": [
            "Male"
        ],

        "ageGroup": [
            "18-21"
        ],

        "shoppingTime": [
            "Evening"
        ],

        "favoriteCategories": [
            "Sportswear"
        ],

        "purchaseFactor": [
            "Brand"
        ],

        "trendSource": [
            "Instagram"
        ],

        "preferredFit": [
            "Relaxed"
        ],

        "nextColor": [
            "Black"
        ],

        "city": [
            "Kolkata"
        ],

        "preferredSize": [
            "L"
        ],

        "outOfStockBehaviour": [
            "Buy another product"
        ],

        "shoppingMode": [
            "Online"
        ],

        "shoppingSeason": [
            "Summer"
        ],

        "revisitReason": [
            "New Collection"
        ],

        "occupation": [
            "Student"
        ],

        "trendPurchaseSpeed": [
            "Within a week"
        ],

        "trendFollower": [
            "Yes"
        ],

        "brandReason": [
            "Quality"
        ],

        "leastPurchased": [
            "Formal Wear"
        ],

        "favoriteColors": [
            "Black"
        ]

    })


    # Keep exact feature order

    new_customer = (
        new_customer[
            FEATURES
        ]
    )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = (
        rf_model.predict(
            new_customer
        )
    )


    print(
        "\nPredicted next purchase:"
    )


    print(
        prediction[0]
    )


    # --------------------------------------------------------
    # Prediction probabilities
    # --------------------------------------------------------

    probabilities = (
        rf_model
        .predict_proba(
            new_customer
        )[0]
    )


    classes = (
        rf_model
        .named_steps[
            "classifier"
        ]
        .classes_
    )


    prediction_df = pd.DataFrame({

        "Product":
            classes,

        "Probability":
            probabilities

    })


    prediction_df[
        "Probability"
    ] = (

        prediction_df[
            "Probability"
        ]

        * 100

    ).round(2)


    prediction_df = (

        prediction_df

        .sort_values(

            "Probability",

            ascending=False

        )

        .reset_index(
            drop=True
        )

    )


    print(
        "\nPurchase probabilities:"
    )


    print(
        prediction_df
    )


# ============================================================
# 45. SAVE EVERYTHING TO EXCEL
# ============================================================

print("\n" + "=" * 70)
print("SAVING RESULTS")
print("=" * 70)


try:

    with pd.ExcelWriter(

        OUTPUT_FILE,

        engine="openpyxl"

    ) as writer:


        # ----------------------------------------------------
        # Cleaned data
        # ----------------------------------------------------

        df.to_excel(

            writer,

            sheet_name="Cleaned_Data",

            index=False

        )


        # ----------------------------------------------------
        # Product demand
        # ----------------------------------------------------

        product_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Product_Demand"

        )


        # ----------------------------------------------------
        # Product percentage
        # ----------------------------------------------------

        product_percentage.to_frame(
            "Percentage"
        ).to_excel(

            writer,

            sheet_name="Product_Percentage"

        )


        # ----------------------------------------------------
        # Summer
        # ----------------------------------------------------

        summer_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Summer_Demand"

        )


        # ----------------------------------------------------
        # Winter
        # ----------------------------------------------------

        winter_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Winter_Demand"

        )


        # ----------------------------------------------------
        # Brands
        # ----------------------------------------------------

        brand_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Brands"

        )


        # ----------------------------------------------------
        # Categories
        # ----------------------------------------------------

        category_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Categories"

        )


        # ----------------------------------------------------
        # Purchase factors
        # ----------------------------------------------------

        purchase_factor.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Purchase_Factors"

        )


        # ----------------------------------------------------
        # Sizes
        # ----------------------------------------------------

        size_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Sizes"

        )


        # ----------------------------------------------------
        # Colors
        # ----------------------------------------------------

        color_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Colors"

        )


        # ----------------------------------------------------
        # Fits
        # ----------------------------------------------------

        fit_demand.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Fits"

        )


        # ----------------------------------------------------
        # Shopping mode
        # ----------------------------------------------------

        shopping_mode.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Shopping_Mode"

        )


        # ----------------------------------------------------
        # Stock behavior
        # ----------------------------------------------------

        stock_behavior.to_frame(
            "Count"
        ).to_excel(

            writer,

            sheet_name="Stock_Behavior"

        )


        # ----------------------------------------------------
        # Cross analyses
        # ----------------------------------------------------

        city_product.to_excel(

            writer,

            sheet_name="City_Product"

        )


        age_product.to_excel(

            writer,

            sheet_name="Age_Product"

        )


        season_product.to_excel(

            writer,

            sheet_name="Season_Product"

        )


        category_product.to_excel(

            writer,

            sheet_name="Category_Product"

        )


        brand_product.to_excel(

            writer,

            sheet_name="Brand_Product"

        )


        # ----------------------------------------------------
        # Chi-square
        # ----------------------------------------------------

        chi_square_df.to_excel(

            writer,

            sheet_name="Chi_Square",

            index=False

        )


        # ----------------------------------------------------
        # Feature importance
        # ----------------------------------------------------

        importance_df.to_excel(

            writer,

            sheet_name="Feature_Importance",

            index=False

        )


        # ----------------------------------------------------
        # Stock recommendations
        # ----------------------------------------------------

        stock_recommendation_df.to_excel(

            writer,

            sheet_name="Stock_Recommendations",

            index=False

        )


        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        if not prediction_df.empty:

            prediction_df.to_excel(

                writer,

                sheet_name="Prediction",

                index=False

            )


        # ----------------------------------------------------
        # Customer clusters
        # ----------------------------------------------------

        if cluster_available:

            ml_data.to_excel(

                writer,

                sheet_name="Customer_Clusters",

                index=False

            )


    print(
        "\n✅ Excel file successfully created!"
    )


    print(
        "\nFile:"
    )


    print(
        OUTPUT_FILE
    )


except Exception as error:

    print(
        "\n❌ ERROR SAVING EXCEL FILE:"
    )

    print(error)


# ============================================================
# 46. FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FINAL SUMMARY")
print("=" * 70)


print(
    "\nTotal customers:",
    len(df)
)


if len(product_demand) > 0:

    print(
        "Most demanded product:",
        product_demand.idxmax()
    )


if len(category_demand) > 0:

    print(
        "Most popular category:",
        category_demand.idxmax()
    )


if len(brand_demand) > 0:

    print(
        "Most popular brand:",
        brand_demand.idxmax()
    )


if len(size_demand) > 0:

    print(
        "Most preferred size:",
        size_demand.idxmax()
    )


if len(fit_demand) > 0:

    print(
        "Most preferred fit:",
        fit_demand.idxmax()
    )


if len(shopping_mode) > 0:

    print(
        "Most popular shopping mode:",
        shopping_mode.idxmax()
    )


if not np.isnan(accuracy):

    print(
        "\nRandom Forest accuracy:",
        round(
            accuracy * 100,
            2
        ),
        "%"
    )


if len(cv_scores) > 0:

    print(
        "Cross-validation accuracy:",
        round(
            cv_scores.mean() * 100,
            2
        ),
        "%"
    )


print(
    "\n📁 Excel results saved as:"
)

print(
    OUTPUT_FILE
)


print(
    "\n✅ ANALYSIS COMPLETE!"
)

print(
    "=" * 70
)