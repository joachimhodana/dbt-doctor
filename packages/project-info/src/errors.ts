export class DbtDoctorError extends Error {
  override readonly name: string = "DbtDoctorError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProjectNotFoundError extends DbtDoctorError {
  override readonly name = "ProjectNotFoundError";
  readonly directory: string;

  constructor(directory: string, options?: ErrorOptions) {
    super(
      `No dbt project found in ${directory}. Expected a dbt_project.yml at the directory root or in a parent directory.`,
      options,
    );
    this.directory = directory;
  }
}

export class DbtProjectNotFoundError extends DbtDoctorError {
  override readonly name = "DbtProjectNotFoundError";
  readonly directory: string;

  constructor(directory: string, options?: ErrorOptions) {
    super(
      `No dbt_project.yml found in ${directory}. Run \`dbt init\` or point dbt-doctor at your project root.`,
      options,
    );
    this.directory = directory;
  }
}

/** @deprecated Use DbtProjectNotFoundError */
export const NoReactDependencyError = DbtProjectNotFoundError;

/** @deprecated Use DbtProjectNotFoundError */
export const PackageJsonNotFoundError = DbtProjectNotFoundError;

export class AmbiguousProjectError extends DbtDoctorError {
  override readonly name = "AmbiguousProjectError";
  readonly directory: string;
  readonly candidates: readonly string[];

  constructor(directory: string, candidates: readonly string[], options?: ErrorOptions) {
    super(
      `Multiple dbt projects found under ${directory} (${candidates.length} candidates): ${candidates.join(", ")}. Re-run with one of those subdirectories, or set rootDir in dbt-doctor.config.json.`,
      options,
    );
    this.directory = directory;
    this.candidates = candidates;
  }
}

export const isDbtDoctorError = (value: unknown): value is DbtDoctorError =>
  value instanceof DbtDoctorError;
